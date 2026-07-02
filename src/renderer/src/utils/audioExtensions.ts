// v1.10.7: whitelist unica delle estensioni audio accettate dai drop nativi del
// renderer (board e pad FX). Era duplicata in MainGrid.handleNativeDrop e
// FxPadOverlay (rischio di divergenza a ogni aggiunta di formato).
// DEVE restare allineata ad ALLOWED_MEDIA_EXTENSIONS in src/main/index.ts
// (whitelist del protocollo media:// — processo diverso, non importabile da qui).
// webm/mp4 inclusi da DND-05 (v1.3.4): formati audio validi serviti da media://
// e usati dal session recording (WebM/Opus nativo).
export const SUPPORTED_AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus', 'wma', 'webm', 'mp4'];

/** true se il nome file ha un'estensione audio supportata dal drop nativo. */
export const hasSupportedAudioExtension = (fileName: string): boolean => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return !!ext && SUPPORTED_AUDIO_EXTENSIONS.includes(ext);
};
