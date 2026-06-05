import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { evaluateMix, useAudioStore } from '../useAudioStore';
import { useProjectStore } from '../useProjectStore';
import { useSettingsStore } from '../useSettingsStore';
import { IAudioPlayer } from '../../engine/AudioPlayer.interface';
import { AudioClip } from '../../types';
import { makeClip, makeColumn, makeMockPlayer, MockPlayer } from './fixtures';

// Blocco 3 (v1.4.5) — evaluateMix: il "cervello" del mix (ducking/stacco).
// Dipendenze controllate: _duckingFactor/_duckingDuration via useSettingsStore (subscribe
// live), appartenenza colonna via useProjectStore (getColumnForClip), stato mic via
// setMicActive. evaluateMix chiama player.fadeTo(volume, duration): asseriamo su quello.

const DUCK = 0.2;
const DUR = 500;

// Costruisce la mappa activeClips e registra le clip asset/stacco in col-assets
// (serve a getColumnForClip per la rule asset e per la rilevazione dello stacco).
const buildActive = (clips: AudioClip[]) => {
    const players = new Map<string, MockPlayer>();
    const active: Record<string, { player: IAudioPlayer; isPlaying: boolean; progress: number; clip: AudioClip }> = {};
    for (const clip of clips) {
        const p = makeMockPlayer();
        players.set(clip.id, p);
        active[clip.id] = { player: p as unknown as IAudioPlayer, isPlaying: true, progress: 0, clip };
    }
    // Registra in col-assets le clip che la logica considera asset.
    const assetClips = clips.filter(c => c.type === 'asset');
    useProjectStore.setState({
        columns: [makeColumn('col-assets', 'asset', assetClips)],
    });
    return { active, players };
};

beforeEach(() => {
    useSettingsStore.getState().setDuckingSettings({ factor: DUCK, duration: DUR });
});

afterEach(() => {
    useAudioStore.getState().setMicActive(false); // azzera _isMicActiveGlobal
    useProjectStore.setState({ columns: [] });
});

describe('evaluateMix — VOICE', () => {
    it('la voce resta a volume nominale anche con musica attiva', () => {
        const voice = makeClip({ type: 'voice', volume: 0.8 });
        const music = makeClip({ type: 'music', volume: 1.0 });
        const { active, players } = buildActive([voice, music]);
        evaluateMix(active);
        expect(players.get(voice.id)!.last()!.volume).toBeCloseTo(0.8, 6);
    });
});

describe('evaluateMix — MUSIC ducking', () => {
    it('la musica si abbassa quando c\'e\' voce attiva', () => {
        const voice = makeClip({ type: 'voice', volume: 0.9 });
        const music = makeClip({ type: 'music', volume: 1.0 });
        const { active, players } = buildActive([voice, music]);
        evaluateMix(active);
        expect(players.get(music.id)!.last()!.volume).toBeCloseTo(1.0 * DUCK, 6);
        expect(players.get(voice.id)!.last()!.volume).toBeCloseTo(0.9, 6);
    });

    it('la musica si abbassa quando il mic e\' attivo (senza clip voice)', () => {
        useAudioStore.getState().setMicActive(true);
        const music = makeClip({ type: 'music', volume: 1.0 });
        const { active, players } = buildActive([music]);
        evaluateMix(active);
        expect(players.get(music.id)!.last()!.volume).toBeCloseTo(DUCK, 6);
    });

    it('la musica resta piena se non c\'e\' voce/stacco', () => {
        const music = makeClip({ type: 'music', volume: 0.7 });
        const { active, players } = buildActive([music]);
        evaluateMix(active);
        expect(players.get(music.id)!.last()!.volume).toBeCloseTo(0.7, 6);
    });

    it('tratta preshow come music (ducking su voce)', () => {
        const voice = makeClip({ type: 'voice', volume: 1.0 });
        const preshow = makeClip({ type: 'preshow', volume: 1.0 });
        const { active, players } = buildActive([voice, preshow]);
        evaluateMix(active);
        expect(players.get(preshow.id)!.last()!.volume).toBeCloseTo(DUCK, 6);
    });
});

describe('evaluateMix — ASSET (beds/jingle/stacco)', () => {
    it('lo stacco attivo resta pieno, gli altri asset vanno a 0, la musica ducka', () => {
        const stacco = makeClip({ type: 'asset', behavior: 'stacco', volume: 1.0 });
        const otherAsset = makeClip({ type: 'asset', volume: 0.9 });
        const music = makeClip({ type: 'music', volume: 1.0 });
        const { active, players } = buildActive([stacco, otherAsset, music]);
        evaluateMix(active);
        expect(players.get(stacco.id)!.last()!.volume).toBeCloseTo(1.0, 6);   // self-preservation
        expect(players.get(otherAsset.id)!.last()!.volume).toBe(0);            // stacco suppression
        expect(players.get(music.id)!.last()!.volume).toBeCloseTo(DUCK, 6);    // music ducks su stacco
    });

    it('un asset si azzera quando la musica e\' attiva (music dominance)', () => {
        const asset = makeClip({ type: 'asset', volume: 1.0 });
        const music = makeClip({ type: 'music', volume: 1.0 });
        const { active, players } = buildActive([asset, music]);
        evaluateMix(active);
        expect(players.get(asset.id)!.last()!.volume).toBe(0);
    });

    it('un asset ducka quando c\'e\' voce (no musica, no stacco)', () => {
        const asset = makeClip({ type: 'asset', volume: 1.0 });
        const voice = makeClip({ type: 'voice', volume: 1.0 });
        const { active, players } = buildActive([asset, voice]);
        evaluateMix(active);
        expect(players.get(asset.id)!.last()!.volume).toBeCloseTo(DUCK, 6);
    });

    it('un asset resta pieno se e\' da solo', () => {
        const asset = makeClip({ type: 'asset', volume: 0.85 });
        const { active, players } = buildActive([asset]);
        evaluateMix(active);
        expect(players.get(asset.id)!.last()!.volume).toBeCloseTo(0.85, 6);
    });
});

describe('evaluateMix — SFX', () => {
    it('lo sfx ducka a meta\' volume su voce attiva', () => {
        const sfx = makeClip({ type: 'sfx', volume: 1.0 });
        const voice = makeClip({ type: 'voice', volume: 1.0 });
        const { active, players } = buildActive([sfx, voice]);
        evaluateMix(active);
        expect(players.get(sfx.id)!.last()!.volume).toBeCloseTo(0.5, 6);
    });
});

describe('evaluateMix — guardia safeVolume', () => {
    it('forza 0 se il volume target non e\' finito (NaN)', () => {
        const music = makeClip({ type: 'music', volume: NaN });
        const { active, players } = buildActive([music]);
        evaluateMix(active);
        expect(players.get(music.id)!.last()!.volume).toBe(0);
    });

    it('clampa il volume a 1.5 massimo', () => {
        const music = makeClip({ type: 'music', volume: 5 });
        const { active, players } = buildActive([music]);
        evaluateMix(active);
        expect(players.get(music.id)!.last()!.volume).toBe(1.5);
    });
});

describe('evaluateMix — durata di applicazione', () => {
    it('applica duration 0 alla clip appena avviata (newClipId), duckingDuration alle altre', () => {
        const a = makeClip({ type: 'music', volume: 1.0 });
        const b = makeClip({ type: 'music', volume: 1.0 });
        const { active, players } = buildActive([a, b]);
        evaluateMix(active, a.id);
        expect(players.get(a.id)!.last()!.duration).toBe(0);
        expect(players.get(b.id)!.last()!.duration).toBe(DUR);
    });

    it('rispetta overrideDuration (mic ducking rapido)', () => {
        const music = makeClip({ type: 'music', volume: 1.0 });
        const { active, players } = buildActive([music]);
        evaluateMix(active, undefined, 60);
        expect(players.get(music.id)!.last()!.duration).toBe(60);
    });
});
