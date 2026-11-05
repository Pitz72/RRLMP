import { describe, it, expect, beforeEach, vi } from 'vitest';

// v1.15.37 — MODALITÀ MIX: con la vista MIX aperta, un passaggio MANUALE da un
// brano Music all'altro (clic, tasto, MIDI, telefono: passano tutti da playClip)
// diventa un mix invece di un taglio. StreamPlayer finto con posizione e rate
// controllabili, per verificare anche i passaggi rapidi (classifica, medley).
const players = vi.hoisted(() => [] as Array<{
    path: string; rate: number; time: number; fades: Array<[number, number]>; seeks: number[]; stopped: boolean;
}>);
vi.mock('../../engine/StreamPlayer', () => ({
    StreamPlayer: class {
        path = ''; rate = 1; time = 40; fades: Array<[number, number]> = []; seeks: number[] = []; stopped = false;
        constructor() { players.push(this); }
        load(path: string) { this.path = path; return Promise.resolve(); }
        getDuration() { return 240; }
        getCurrentTime() { return this.time; }
        getPlaybackRate() { return this.rate; }
        setPlaybackRate(r: number) { this.rate = r; }
        play() { /* no-op */ }
        stop() { this.stopped = true; }
        cleanup() { /* no-op */ }
        setBus() { /* no-op */ }
        updateSettings() { /* no-op */ }
        fadeTo(v: number, d: number) { this.fades.push([v, d]); }
        isFadingOut() { return false; }
        seek(t: number) { this.seeks.push(t); this.time = t; }
        onEnded() { /* no-op */ }
        onPreEnd() { /* no-op */ }
        onIntroReached() { /* no-op */ }
        onOutroReached() { /* no-op */ }
        onPlaybackError() { /* no-op */ }
        onFadeOutStart() { /* no-op */ }
    },
}));

import { useAudioStore } from '../useAudioStore';
import { useProjectStore } from '../useProjectStore';
import { useSettingsStore } from '../useSettingsStore';
import { makeClip, makeColumn } from './fixtures';

const beat = (bpm: number) => ({ bpm, beatOffsetSec: 0.2, bpmConfidence: 0.8, beatGridScore: 4, bpmCheckedV2: true, bpmCheckedV3: true });
const A = makeClip({ id: 'A', name: 'Brano A', type: 'music', path: 'C:/m/a.mp3', ...beat(124) });
const B = makeClip({ id: 'B', name: 'Brano B', type: 'music', path: 'C:/m/b.mp3', ...beat(120) });
const C = makeClip({ id: 'C', name: 'Brano C', type: 'music', path: 'C:/m/c.mp3', ...beat(118) });
const NOBPM = makeClip({ id: 'N', name: 'Senza BPM', type: 'music', path: 'C:/m/n.mp3' });
const JINGLE = makeClip({ id: 'J', name: 'Jingle', type: 'asset', path: 'C:/j/j.mp3' });

const audio = () => useAudioStore.getState();
const playerOf = (id: string) => audio().activeClips[id]?.player as unknown as (typeof players)[number] | undefined;

beforeEach(() => {
    audio().stopAll();
    audio().setMixMode(false);
    useAudioStore.setState({ lastAutomix: null, fadingClipIds: [] });
    useSettingsStore.setState({ automixBeats: 8, crossfadeDuration: 2000 });
    players.length = 0;
    useProjectStore.setState({
        isDirty: false,
        columns: [
            makeColumn('col-jingle', 'asset', [{ ...JINGLE }]),
            makeColumn('col-music', 'music', [{ ...A }, { ...B }, { ...C }, { ...NOBPM }]),
        ],
    });
});

describe('modalità MIX spenta — comportamento di sempre', () => {
    it('il brano lanciato a mano taglia quello in onda', async () => {
        await audio().playClip(A);
        await audio().playClip(B);
        expect(audio().activeClips.A).toBeUndefined();
        expect(audio().activeClips.B).toBeDefined();
        expect(audio().fadingClipIds).toEqual([]);
    });
});

describe('modalità MIX accesa — il passaggio manuale diventa un mix', () => {
    beforeEach(() => audio().setMixMode(true));

    it('clic sul brano dopo: mix a tempo, l\'uscente sfuma invece di sparire', async () => {
        await audio().playClip(A);
        await audio().playClip(B);
        expect(audio().activeClips.A).toBeDefined();          // ancora in onda, in dissolvenza
        expect(audio().fadingClipIds).toContain('A');
        expect(audio().activeClips.B).toBeDefined();
        expect(audio().lastAutomix).toMatchObject({ mode: 'beatmatched', from: 'A', to: 'B' });
        expect(playerOf('B')!.rate).toBeCloseTo(124 / 120, 6); // agganciato al tempo di A
        const fadeOut = playerOf('A')!.fades.at(-1)!;
        expect(fadeOut[0]).toBe(0);
        expect(fadeOut[1]).toBe(Math.round(8 * 60 / 124 * 1000)); // 8 beat di A
    });

    it('vale per qualunque brano della scaletta, non solo il successivo', async () => {
        await audio().playClip(A);
        await audio().playClip(C);
        expect(audio().fadingClipIds).toContain('A');
        expect(audio().lastAutomix).toMatchObject({ from: 'A', to: 'C' });
    });

    it('passaggi rapidi: il brano dopo si aggancia al tempo UDITO del brano in onda', async () => {
        await audio().playClip(A);       // 124 BPM
        await audio().playClip(B);       // B suona a 124/120 → si sente a 124
        await audio().playClip(C);       // subito dopo: C va agganciato a 124, non a 120
        expect(playerOf('C')!.rate).toBeCloseTo(124 / 118, 6);
        expect(playerOf('B')!.rate).toBeCloseTo(124 / 120, 6); // congelato durante il crossfade
        // A, ancora in dissolvenza dal primo passaggio, esce in 250 ms: mai tre brani insieme
        expect(playerOf('A')!.fades.at(-1)).toEqual([0, 250]);
        expect(audio().fadingClipIds).toEqual(expect.arrayContaining(['A', 'B']));
    });

    it('durata del mix CORTO (4 beat)', async () => {
        useSettingsStore.setState({ automixBeats: 4 });
        await audio().playClip(A);
        await audio().playClip(B);
        expect(playerOf('A')!.fades.at(-1)![1]).toBe(Math.round(4 * 60 / 124 * 1000));
    });

    it('brano senza BPM: crossfade classico (mai un taglio)', async () => {
        await audio().playClip(A);
        await audio().playClip(NOBPM);
        expect(audio().activeClips.A).toBeDefined();
        expect(audio().fadingClipIds).toContain('A');
        expect(audio().lastAutomix).toMatchObject({ mode: 'classic', reason: 'missing-bpm' });
    });

    it('clic sul brano in onda lo ferma (come sempre)', async () => {
        await audio().playClip(A);
        await audio().playClip(A);
        expect(audio().activeClips.A).toBeUndefined();
    });

    it('nulla in onda: il brano parte normalmente', async () => {
        await audio().playClip(B);
        expect(audio().activeClips.B).toBeDefined();
        expect(audio().lastAutomix).toBeNull();
    });

    it('i lanci macchina (catena play_next, transizioni) non vengono deviati', async () => {
        await audio().playClip(A);
        await audio().playClip(B, undefined, { machine: true });
        expect(audio().activeClips.A).toBeUndefined();
        expect(audio().lastAutomix).toBeNull();
    });

    it('PROSSIMO verso il brano che sta ancora sfumando: esce subito e riparte col mix (collaudo 2026-11-05)', async () => {
        await audio().playClip(A);
        await audio().playClip(B);                 // A in dissolvenza
        const oldA = playerOf('A')!;
        const r = await audio().automixTransition('B', 'A');
        expect(r.mode).toBe('beatmatched');
        expect(oldA.fades.at(-1)).toEqual([0, 40]); // il vecchio A esce in 40 ms
        expect(oldA.stopped).toBe(true);
        expect(playerOf('A')).not.toBe(oldA);       // A riparte con un player nuovo
        expect(audio().fadingClipIds).toContain('B');
        expect(audio().fadingClipIds).not.toContain('A');
    });

    it('un passaggio impossibile viene comunque segnalato (non più ignorato in silenzio)', async () => {
        await audio().playClip(A);
        const r = await audio().automixTransition('A', 'zzz');
        expect(r.mode).toBe('skipped');
        expect(audio().lastAutomix).toMatchObject({ mode: 'skipped', to: 'zzz' });
    });

    it('le altre colonne non sono toccate (un jingle non diventa un mix)', async () => {
        await audio().playClip(A);
        await audio().playClip(JINGLE);
        expect(audio().lastAutomix).toBeNull();
    });
});
