import { afterEach, vi } from 'vitest';

// Setup globale per i test del motore audio (v1.4.5).
// In jsdom NON esistono ne' Web Audio API ne' window.electron: li stubbiamo qui in
// modo che l'import dei moduli del renderer (useAudioStore → AudioContextManager,
// StreamPlayer, useProjectStore) non esploda. I test PURI (evaluateMix,
// computeLoudnessGain, rotazione) non toccano l'AudioContext reale; lo stub e'
// una rete di sicurezza nel caso un percorso chiamasse getInstance().

// --- Stub minimo di AudioContext / OfflineAudioContext ---
class FakeAudioNode {
    connect() { return this; }
    disconnect() { /* no-op */ }
}
class FakeAudioContext {
    destination = new FakeAudioNode();
    currentTime = 0;
    sampleRate = 48000;
    state = 'running';
    createGain() { return { gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
    createBiquadFilter() { return { type: 'allpass', frequency: { value: 0, setValueAtTime() {} }, Q: { value: 0 }, connect() {}, disconnect() {} }; }
    createDynamicsCompressor() {
        const p = () => ({ value: 0, setValueAtTime() {} });
        return { threshold: p(), knee: p(), ratio: p(), attack: p(), release: p(), reduction: 0, connect() {}, disconnect() {} };
    }
    createAnalyser() { return { fftSize: 2048, frequencyBinCount: 1024, getFloatTimeDomainData() {}, getByteFrequencyData() {}, connect() {}, disconnect() {} }; }
    createChannelSplitter() { return new FakeAudioNode(); }
    createMediaElementSource() { return new FakeAudioNode(); }
    resume() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).AudioContext = FakeAudioContext;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).OfflineAudioContext = FakeAudioContext;

// --- Stub di window.electron (solo i metodi toccati dai percorsi sotto test) ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).electron = {
    measureLoudness: vi.fn().mockResolvedValue({ success: false }),
    getAudioMetadata: vi.fn().mockResolvedValue({ success: false }),
    getFilePath: vi.fn().mockReturnValue(''),
    checkFilesExist: vi.fn().mockResolvedValue({ missing: [] }),
};

afterEach(() => {
    vi.restoreAllMocks();
});
