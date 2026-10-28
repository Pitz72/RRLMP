import { describe, it, expect, beforeEach, vi } from 'vitest';

// v1.15.35 (G4, M1) — percorso di errore e durata in playClip/loadClip.
// StreamPlayer finto: `load` fallisce sui path che contengono "bad" (subito) o
// "slowbad" (dopo 20 ms), riesce sugli altri; durata fissa 120 s.
const loads = vi.hoisted(() => [] as string[]);
vi.mock('../../engine/StreamPlayer', () => ({
    StreamPlayer: class {
        load(path: string) {
            loads.push(path);
            if (path.includes('slowbad')) return new Promise<void>((_, reject) => setTimeout(() => reject(new Error('decode')), 20));
            if (path.includes('bad')) return Promise.reject(new Error('decode'));
            return Promise.resolve();
        }
        getDuration() { return 120; }
        getCurrentTime() { return 0; }
        play() { /* no-op */ }
        stop() { /* no-op */ }
        cleanup() { /* no-op */ }
        setBus() { /* no-op */ }
        updateSettings() { /* no-op */ }
        fadeTo() { /* no-op */ }
        isFadingOut() { return false; }
        seek() { /* no-op */ }
        onEnded() { /* no-op */ }
        onPreEnd() { /* no-op */ }
        onIntroReached() { /* no-op */ }
        onOutroReached() { /* no-op */ }
        onPlaybackError() { /* no-op */ }
        onFadeOutStart() { /* no-op */ }
    },
}));

import { useAudioStore, resetPreshowRotation } from '../useAudioStore';
import { useProjectStore } from '../useProjectStore';
import { useToastStore } from '../useToastStore';
import { makeClip, makeColumn } from './fixtures';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const bad = makeClip({ id: 'bad', name: 'Brano WMA', type: 'preshow', nextAction: 'play_next', path: 'C:/m/bad.wma' });
const good = makeClip({ id: 'good', name: 'Brano OK', type: 'preshow', nextAction: 'play_next', path: 'C:/m/good.mp3' });
const slow = makeClip({ id: 'slow', name: 'Lento', type: 'preshow', nextAction: 'play_next', path: 'C:/m/slowbad.wma' });
const jingle = makeClip({ id: 'jin', name: 'Jingle', type: 'asset', duration: 0, path: 'C:/j/jingle.mp3' });

beforeEach(() => {
    useAudioStore.getState().stopAll();
    resetPreshowRotation();
    useToastStore.setState({ toasts: [] });
    loads.length = 0;
    useProjectStore.setState({
        isDirty: false,
        columns: [
            makeColumn('col-assets', 'asset', []),
            makeColumn('col-jingle', 'asset', [{ ...jingle }]),
            makeColumn('col-preshow', 'preshow', [{ ...bad }, { ...good }]),
        ],
    });
});

describe('playClip — lancio fallito (G4)', () => {
    it('in una catena (lancio macchina) passa alla clip successiva e avvisa', async () => {
        await useAudioStore.getState().playClip(bad, undefined, { machine: true });
        await wait(60); // scheduleSequencerPlay (20 ms) + load della successiva
        expect(useAudioStore.getState().activeClips.good).toBeDefined();
        expect(useToastStore.getState().toasts.some((t) => t.message.includes('Brano WMA'))).toBe(true);
    });

    it('un clic dell\'operatore non fa partire altro, ma avvisa', async () => {
        await useAudioStore.getState().playClip(bad);
        await wait(60);
        expect(useAudioStore.getState().activeClips.good).toBeUndefined();
        expect(useToastStore.getState().toasts).toHaveLength(1);
    });

    it('dopo un fallimento il clic successivo riprova davvero (non viene preso per "annulla")', async () => {
        await useAudioStore.getState().playClip(bad);
        await useAudioStore.getState().playClip(bad);
        expect(loads.filter((p) => p.includes('bad.wma'))).toHaveLength(2);
    });

    it('se nel frattempo è arrivato STOP ALL non avanza e non avvisa', async () => {
        useProjectStore.setState({
            columns: [makeColumn('col-preshow', 'preshow', [{ ...slow }, { ...good }])],
        });
        const pending = useAudioStore.getState().playClip(slow, undefined, { machine: true });
        useAudioStore.getState().stopAll();
        await pending;
        await wait(60);
        expect(useAudioStore.getState().activeClips.good).toBeUndefined();
        expect(useToastStore.getState().toasts).toHaveLength(0);
    });
});

describe('durata delle clip JINGLE/PROMO (M1)', () => {
    it('loadClip scrive la durata sulla colonna reale (JINGLE), non su SHOW ASSETS', async () => {
        await useAudioStore.getState().loadClip(jingle);
        const col = useProjectStore.getState().columns.find((c) => c.id === 'col-jingle')!;
        expect(col.clips[0].duration).toBe(120);
        expect(useProjectStore.getState().isDirty).toBe(false);
    });

    it('al primo play una clip senza durata viene riparata, senza sporcare il progetto', async () => {
        await useAudioStore.getState().playClip(jingle);
        const col = useProjectStore.getState().columns.find((c) => c.id === 'col-jingle')!;
        expect(col.clips[0].duration).toBe(120);
        expect(useAudioStore.getState().activeClips.jin.clip.duration).toBe(120);
        expect(useProjectStore.getState().isDirty).toBe(false);
    });
});
