import { AudioClip, Column, ClipType, RotationConfig } from '../../types';

// Fixtures condivise per i test del motore audio (v1.4.5).
// makeClip crea una AudioClip valida con default broadcast sensati; override mirati per test.

let _idSeq = 0;
export const makeClip = (over: Partial<AudioClip> = {}): AudioClip => {
    _idSeq += 1;
    return {
        id: over.id ?? `clip-${_idSeq}`,
        name: over.name ?? `Clip ${_idSeq}`,
        path: over.path ?? `C:/audio/clip-${_idSeq}.mp3`,
        type: (over.type ?? 'music') as ClipType,
        color: over.color ?? '#888888',
        volume: over.volume ?? 1.0,
        pan: over.pan ?? 0,
        isLooping: over.isLooping ?? false,
        isPlaying: over.isPlaying ?? false,
        duration: over.duration ?? 180,
        currentTime: over.currentTime ?? 0,
        nextAction: over.nextAction ?? 'stop',
        behavior: over.behavior ?? 'normal',
        duckingRole: over.duckingRole ?? 'none',
        fadeIn: over.fadeIn ?? 0,
        fadeOut: over.fadeOut ?? 0,
        ...over,
    };
};

export const makeColumn = (id: string, type: ClipType, clips: AudioClip[], rotation?: RotationConfig): Column => ({
    id,
    title: id,
    type,
    clips,
    color: '#888888',
    isLocked: false,
    ...(rotation ? { rotation } : {}),
});

// Player finto per evaluateMix: registra le chiamate a fadeTo.
export interface MockPlayer {
    fadeTo: (volume: number, duration: number) => void;
    calls: Array<{ volume: number; duration: number }>;
    last(): { volume: number; duration: number } | undefined;
}
export const makeMockPlayer = (): MockPlayer => {
    const calls: Array<{ volume: number; duration: number }> = [];
    return {
        calls,
        fadeTo(volume: number, duration: number) { calls.push({ volume, duration }); },
        last() { return calls[calls.length - 1]; },
    };
};
