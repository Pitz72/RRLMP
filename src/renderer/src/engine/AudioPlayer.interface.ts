import { AudioClip } from '../types';

export interface IAudioPlayer {
    load(path: string): Promise<void>;
    play(): void;
    stop(): void;
    seek(time: number): void;
    setVolume(value: number): void;
    getCurrentTime(): number;
    getDuration(): number;
    cleanup(): void;

    // Routing
    setOutputDevice(deviceId: string): void;
    setBus(bus: GainNode): void;
    onEnded(callback: () => void): void;
    onFadeOutStart(callback: () => void): void;
    onPreEnd(callback: (clipId: string) => void): void;
    onIntroReached(callback: (clipId: string) => void): void;
    onOutroReached(callback: (clipId: string) => void): void;
    // v1.4.10 (#20): errore media DURANTE la riproduzione (drive scollegato, file
    // corrotto a metà). Opzionale: gli errori in fase di load restano gestiti dal
    // reject di load(). Senza handler la clip restava "zombie" in activeClips e la
    // catena play_next non avanzava (dead air).
    onPlaybackError?(callback: (clipId: string) => void): void;
    updateSettings(clip: AudioClip): void;
    fadeTo(volume: number, duration: number): void;
    // v1.15.16 (G1): true mentre è in corso la dissolvenza FINALE della clip
    // (quella armata da StreamPlayer.ontimeupdate quando mancano fadeOut ms alla
    // fine). evaluateMix deve saltare questi player: riapplicare un volume
    // cancellerebbe la rampa verso 0 e riporterebbe la clip a volume pieno
    // nell'ultimo tratto. Opzionale — un player che non lo implementa si comporta
    // come prima (nessuna protezione, ma nessuna rottura).
    isFadingOut?(): boolean;
    // v1.10.23 (Automix Fase C2): tempo-match dell'entrante. Opzionali — solo
    // StreamPlayer li implementa; il controller automix degrada senza (optional
    // chaining), nessun altro percorso dell'app li usa.
    setPlaybackRate?(rate: number): void;
    getPlaybackRate?(): number;
}
