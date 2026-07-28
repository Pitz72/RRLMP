import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { evaluateMix, useAudioStore } from '../useAudioStore';
import { useProjectStore } from '../useProjectStore';
import { useSettingsStore } from '../useSettingsStore';
import { IAudioPlayer } from '../../engine/AudioPlayer.interface';
import { AudioClip } from '../../types';
import { makeClip, makeColumn, makeMockPlayer, MockPlayer } from './fixtures';

// Blocco 3 (v1.4.5) — evaluateMix: il "cervello" del mix (ducking).
// Dipendenze controllate: _duckingFactor/_duckingDuration via useSettingsStore (subscribe
// live), appartenenza colonna via useProjectStore (getColumnForClip), stato mic via
// setMicActive. evaluateMix chiama player.fadeTo(volume, duration): asseriamo su quello.

const DUCK = 0.2;
const DUR = 500;

// Costruisce la mappa activeClips e registra le clip asset in col-assets
// (serve a getColumnForClip per la rule asset).
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

    it('la musica resta piena se non c\'e\' voce', () => {
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

describe('evaluateMix — ASSET (beds/jingle)', () => {
    // v1.15.15: behavior 'stacco' è LEGACY e il motore lo ignora — una clip
    // marcata stacco è un asset come gli altri (music dominance la azzera,
    // la musica NON ducka). Le vie di regia per "stacchetto sopra la musica"
    // sono le colonne FX (esente da dominance) e VOICE (ducka tutto).
    it('behavior stacco legacy IGNORATO: asset azzerato dalla musica, musica piena', () => {
        const legacyStacco = makeClip({ type: 'asset', behavior: 'stacco', volume: 1.0 });
        const otherAsset = makeClip({ type: 'asset', volume: 0.9 });
        const music = makeClip({ type: 'music', volume: 1.0 });
        const { active, players } = buildActive([legacyStacco, otherAsset, music]);
        evaluateMix(active);
        expect(players.get(legacyStacco.id)!.last()!.volume).toBe(0);       // music dominance
        expect(players.get(otherAsset.id)!.last()!.volume).toBe(0);          // music dominance
        expect(players.get(music.id)!.last()!.volume).toBeCloseTo(1.0, 6);   // nessun ducking da stacco
    });

    it('un asset si azzera quando la musica e\' attiva (music dominance)', () => {
        const asset = makeClip({ type: 'asset', volume: 1.0 });
        const music = makeClip({ type: 'music', volume: 1.0 });
        const { active, players } = buildActive([asset, music]);
        evaluateMix(active);
        expect(players.get(asset.id)!.last()!.volume).toBe(0);
    });

    it('un asset ducka quando c\'e\' voce (no musica)', () => {
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

    // A3 (2026-06-30): il sottofondo in loop si azzera sotto un jingle/sigla (asset non-loop)
    it('un sottofondo in LOOP si azzera quando e\' attivo un asset/jingle NON in loop', () => {
        const bed = makeClip({ type: 'asset', volume: 1.0, isLooping: true });
        const jingle = makeClip({ type: 'asset', volume: 1.0, isLooping: false });
        const { active, players } = buildActive([bed, jingle]);
        evaluateMix(active);
        expect(players.get(bed.id)!.last()!.volume).toBe(0);             // bed azzerato
        expect(players.get(jingle.id)!.last()!.volume).toBeCloseTo(1.0, 6); // jingle pieno
    });

    it('il sottofondo in LOOP da solo resta pieno (nessun jingle in onda → rientro)', () => {
        const bed = makeClip({ type: 'asset', volume: 0.7, isLooping: true });
        const { active, players } = buildActive([bed]);
        evaluateMix(active);
        expect(players.get(bed.id)!.last()!.volume).toBeCloseTo(0.7, 6);
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

// v1.4.6 (revisione 2026-06-10, reperto #1)
// v1.15.28: tolti i due test sul meccanismo `suppressedClips`, rimosso insieme al
// codice che leggeva quella mappa (era il residuo del behavior 'Stacco' della v1.15.15:
// nessuno la scriveva più).
describe('evaluateMix — clip in transizione', () => {
    it('NON tocca le clip in fadingClipIds (il fade-out di transizione non va cancellato)', () => {
        const fading = makeClip({ type: 'preshow', volume: 1.0 });
        const entering = makeClip({ type: 'preshow', volume: 0.8 });
        const { active, players } = buildActive([fading, entering]);
        evaluateMix(active, entering.id, undefined, { fadingClipIds: [fading.id] });
        expect(players.get(fading.id)!.last()).toBeUndefined();              // mai chiamata fadeTo
        expect(players.get(entering.id)!.last()!.volume).toBeCloseTo(0.8, 6); // l'entrante sì
    });

    it('legge fadingClipIds dallo store quando mixState non è passato', () => {
        const fading = makeClip({ type: 'music', volume: 1.0 });
        const { active, players } = buildActive([fading]);
        useAudioStore.setState({ fadingClipIds: [fading.id] });
        evaluateMix(active);
        expect(players.get(fading.id)!.last()).toBeUndefined();
        useAudioStore.setState({ fadingClipIds: [] });
    });

    it('mixa normalmente quando nessuna clip è in transizione', () => {
        const clip = makeClip({ type: 'music', volume: 0.9 });
        const { active, players } = buildActive([clip]);
        evaluateMix(active, undefined, undefined, { fadingClipIds: [] });
        expect(players.get(clip.id)!.last()!.volume).toBeCloseTo(0.9, 6);
    });
});

// v1.15.16 (G1) — dissolvenza FINALE della clip (armata dal player, NON dallo store):
// non finisce in fadingClipIds, quindi prima di questa guardia qualunque play/stop
// concorrente negli ultimi secondi riportava il brano a volume pieno.
describe('evaluateMix — dissolvenza finale della clip', () => {
    // Variante di buildActive che marca alcune clip come "in dissolvenza finale".
    const buildActiveWithFading = (clips: AudioClip[], fadingIds: string[]) => {
        const players = new Map<string, MockPlayer>();
        const active: Record<string, { player: IAudioPlayer; isPlaying: boolean; progress: number; clip: AudioClip }> = {};
        for (const clip of clips) {
            const p = makeMockPlayer(fadingIds.includes(clip.id));
            players.set(clip.id, p);
            active[clip.id] = { player: p as unknown as IAudioPlayer, isPlaying: true, progress: 0, clip };
        }
        useProjectStore.setState({ columns: [makeColumn('col-assets', 'asset', clips.filter(c => c.type === 'asset'))] });
        return { active, players };
    };

    it('non tocca una clip nella dissolvenza finale quando parte una voce', () => {
        const music = makeClip({ type: 'music', volume: 1.0 });
        const voice = makeClip({ type: 'voice', volume: 1.0 });
        const { active, players } = buildActiveWithFading([music, voice], [music.id]);
        evaluateMix(active, voice.id);
        // Prima del fix la musica riceveva fadeTo(1.0 * DUCK) e la rampa verso 0 veniva
        // cancellata: nessuna chiamata deve arrivare al player in dissolvenza.
        expect(players.get(music.id)!.calls).toHaveLength(0);
        expect(players.get(voice.id)!.last()!.volume).toBeCloseTo(1.0, 6);
    });

    it('non tocca una clip nella dissolvenza finale nemmeno quando il mix tornerebbe a volume pieno', () => {
        const music = makeClip({ type: 'music', volume: 1.0 });
        const { active, players } = buildActiveWithFading([music], [music.id]);
        evaluateMix(active);
        expect(players.get(music.id)!.calls).toHaveLength(0);
    });

    it('continua a mixare normalmente le clip NON in dissolvenza', () => {
        const fading = makeClip({ type: 'music', volume: 1.0 });
        const normal = makeClip({ type: 'music', volume: 0.8 });
        const voice = makeClip({ type: 'voice', volume: 1.0 });
        const { active, players } = buildActiveWithFading([fading, normal, voice], [fading.id]);
        evaluateMix(active);
        expect(players.get(fading.id)!.calls).toHaveLength(0);
        expect(players.get(normal.id)!.last()!.volume).toBeCloseTo(0.8 * DUCK, 6);
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
