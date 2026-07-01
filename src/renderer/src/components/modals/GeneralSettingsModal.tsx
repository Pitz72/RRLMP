import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAudioStore } from '../../store/useAudioStore';
import { useTranslation } from 'react-i18next';
import { DEFAULT_MASTER_CHAIN } from '../../engine/AudioContextManager';
import { FlagIcon } from '../ui/FlagIcon';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

interface AudioDevice {
    deviceId: string;
    label: string;
}

type SettingsTab = 'general' | 'audio' | 'mic' | 'recording' | 'chain';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'it', label: 'Italiano' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'pt', label: 'Português' },
    { code: 'ru', label: 'Русский' },
    { code: 'zh', label: '中文' },
];

const Toggle: React.FC<{ enabled: boolean; onToggle: () => void; labelOn?: string; labelOff?: string }> = ({
    enabled, onToggle, labelOn = 'On', labelOff = 'Off'
}) => (
    <label className="tgl">
        <span className="tgl-lbl">{enabled ? labelOn : labelOff}</span>
        <div onClick={onToggle} className={`tgl-track ${enabled ? 'on' : ''}`}>
            <div className="tgl-knob" />
        </div>
    </label>
);

const LabeledSlider: React.FC<{
    label: string; value: number; min: number; max: number; step: number;
    display: string; accent?: string; disabled?: boolean;
    onChange: (v: number) => void;
}> = ({ label, value, min, max, step, display, accent = 'accent-emerald-500', disabled, onChange }) => {
    const rngAccent = accent.includes('sky') ? 'sky' : accent.includes('red') ? 'red' : accent.includes('orange') ? 'orange' : 'green';
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">{label}</span>
                <span className={`text-xs font-mono ${disabled ? 'text-zinc-600' : accent.includes('sky') ? 'text-sky-400' : accent.includes('red') ? 'text-red-400' : accent.includes('orange') ? 'text-orange-400' : 'text-emerald-400'}`}>{display}</span>
            </div>
            <input
                type="range" min={min} max={max} step={step} value={value} disabled={disabled}
                onChange={(e) => onChange(step % 1 !== 0 ? parseFloat(e.target.value) : parseInt(e.target.value))}
                className={`rng ${rngAccent}`}
            />
        </div>
    );
};

const SectionTitle: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'text-zinc-500' }) => (
    <h3 className={`sect-h mb-3 ${color}`}>{children}</h3>
);

const Divider: React.FC = () => <div className="divider" />;

export const GeneralSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { t, i18n } = useTranslation();
    const {
        outputDeviceId, setOutputDeviceId,
        duckingFactor, duckingDuration, setDuckingSettings,
        defaultPreshowTransition, setDefaultPreshowTransition,
        crossfadeDuration, segueDuration, setPreshowTransition, setSegueDuration,
        masterChain, setMasterChain,
        loudnessNormEnabled, loudnessTargetLufs, setLoudnessNorm,
        micInputDeviceId, micThresholdDb, micActivationHoldMs, micReleaseHoldMs, micEnabled, micMixEnabled, micVolume, micBypassProcessing, micFeedbackAcknowledged, setMicSettings,
        recordingFormat, setRecordingSettings
    } = useSettingsStore();
    const updateOutputDevice = useAudioStore(s => s.updateOutputDevice);
    const [devices, setDevices] = useState<AudioDevice[]>([]);
    const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    useEffect(() => {
        if (!isOpen) return;
        // MODAL-04 (v1.3.5): timeout 5s su enumerateDevices.
        // Su Windows un device USB in stato anomalo (driver crash, transizione hot-plug)
        // può far ritardare arbitrariamente la enumerate → modal freezeato in stato
        // "vuoto" senza che l'utente capisca cosa sta succedendo. Con Promise.race
        // facciamo cadere graceful e mostriamo liste vuote che il fallback alla scheda
        // di default copre via outputDeviceId='default'.
        const timeout = new Promise<MediaDeviceInfo[]>((_, reject) =>
            window.setTimeout(() => reject(new Error('enumerateDevices timeout')), 5000)
        );
        Promise.race([navigator.mediaDevices.enumerateDevices(), timeout])
            .then(devs => {
                setDevices(devs.filter(d => d.kind === 'audiooutput').map(d => ({
                    deviceId: d.deviceId,
                    label: d.label || `Device ${d.deviceId.substring(0, 5)}...`
                })));
                setInputDevices(devs.filter(d => d.kind === 'audioinput').map(d => ({
                    deviceId: d.deviceId,
                    label: d.label || `Input ${d.deviceId.substring(0, 5)}...`
                })));
            })
            .catch(err => {
                console.warn('[Settings] enumerateDevices fallito:', err);
                setDevices([]);
                setInputDevices([]);
            });
    }, [isOpen]);

    // MODAL-02 (v1.3.5): ESC chiude la modale senza propagare al window
    // (dove c'è il globalShortcut Emergency Stop). Prima ESC su Settings aperta
    // triggera STOP ALL invece di chiudere → operatore in diretta voleva chiudere
    // Settings e si trovava tutto in mute.
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handler, true); // capture phase
        return () => window.removeEventListener('keydown', handler, true);
    }, [isOpen, onClose]);

    const handleChangeDevice = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newId = e.target.value;
        setOutputDeviceId(newId);
        updateOutputDevice(newId);
    };

    if (!isOpen) return null;

    const tabs: { id: SettingsTab; label: string; icon: string }[] = [
        { id: 'general',   label: 'Generali',    icon: '⚙️' },
        { id: 'audio',     label: 'Audio & Mix',  icon: '🎚️' },
        { id: 'mic',       label: 'Microfono',    icon: '🎙️' },
        { id: 'recording', label: 'Registrazione', icon: '⏺' },
        { id: 'chain',     label: 'Master Chain', icon: '⛓️' },
    ];

    return (
        <div className="ov">
            <div className="ov-panel anim-in settings">
                {/* HEADER */}
                <div className="ov-head">
                    <h2 className="ov-title">{t('modal.settings.title')}</h2>
                    <button onClick={onClose} className="ov-x">&times;</button>
                </div>

                {/* TAB BAR */}
                <div className="tabbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`tab ${activeTab === tab.id ? 'on' : ''}`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* BODY */}
                <div className="ov-body">

                    {/* ── TAB: GENERALI ── */}
                    {activeTab === 'general' && (
                        <div className="p-6 space-y-6">
                            <section>
                                <SectionTitle color="text-violet-400">{t('modal.settings.tab.language')}</SectionTitle>
                                <p className="text-[10px] text-zinc-600 italic mb-3">Seleziona la lingua dell'interfaccia. La modifica è immediata.</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {LANGUAGES.map((lng) => {
                                        const isActive = i18n.language === lng.code || i18n.language.startsWith(lng.code);
                                        return (
                                            <button
                                                key={lng.code}
                                                onClick={() => i18n.changeLanguage(lng.code)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${
                                                    isActive
                                                        ? 'border-violet-500 bg-violet-500/10 text-white'
                                                        : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                                                }`}
                                            >
                                                <FlagIcon code={lng.code} className="rounded-sm shadow-sm flex-shrink-0" />
                                                <span className="text-sm font-medium">{lng.label}</span>
                                                {isActive && <span className="ml-auto text-violet-400 text-xs">✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* ── TAB: AUDIO & MIX ── */}
                    {activeTab === 'audio' && (
                        <div className="p-6 space-y-6">

                            {/* OUTPUT DEVICE */}
                            <section>
                                <SectionTitle>{t('modal.settings.outputDevice')}</SectionTitle>
                                <select
                                    value={outputDeviceId}
                                    onChange={handleChangeDevice}
                                    className="sel"
                                >
                                    <option value="default">{t('modal.settings.systemDefault')}</option>
                                    {devices.map(d => (
                                        <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-zinc-600 mt-1">Seleziona la scheda audio (es. Rødecaster). L'audio si sposta immediatamente.</p>
                            </section>

                            <Divider />

                            {/* MIXING INTELLIGENCE */}
                            <section className="space-y-4">
                                <SectionTitle color="text-emerald-500">{t('modal.settings.mixingIntelligence')}</SectionTitle>
                                <LabeledSlider
                                    label={t('modal.settings.duckingReduction')}
                                    value={duckingFactor} min={0} max={1} step={0.05}
                                    display={`${Math.round(duckingFactor * 100)}%`}
                                    accent="accent-emerald-500"
                                    onChange={(v) => setDuckingSettings({ factor: v })}
                                />
                                <p className="text-[10px] text-zinc-600 -mt-2 italic">Volume musica quando lo speaker parla. 20% è lo standard radiofonico.</p>
                                <LabeledSlider
                                    label={t('modal.settings.duckingSpeed')}
                                    value={duckingDuration} min={0} max={2000} step={50}
                                    display={`${duckingDuration}ms`}
                                    accent="accent-emerald-500"
                                    onChange={(v) => setDuckingSettings({ duration: v })}
                                />
                                <p className="text-[10px] text-zinc-600 -mt-2 italic">Più alto = transizione più morbida.</p>
                            </section>

                            <Divider />

                            {/* TRANSIZIONI */}
                            <section className="space-y-4">
                                <SectionTitle color="text-emerald-500">{t('modal.settings.defaultTransition')}</SectionTitle>
                                <select
                                    value={defaultPreshowTransition}
                                    onChange={(e) => setDefaultPreshowTransition(e.target.value as 'crossfade' | 'segue' | 'gapless')}
                                    className="sel"
                                >
                                    <option value="crossfade">Crossfade (Sfumatura Incrociata)</option>
                                    <option value="segue">Segue / Cold Start (Subito Pieno, Prec. Sfuma)</option>
                                    <option value="gapless">Gapless (Taglio Netto / No Fade)</option>
                                </select>
                                <p className="text-[10px] text-zinc-600 -mt-2 italic">Transizione automatica tra clip consecutive con play_next.</p>
                                <LabeledSlider
                                    label={t('modal.settings.crossfadeDuration')}
                                    value={crossfadeDuration} min={200} max={6000} step={100}
                                    display={`${crossfadeDuration}ms`}
                                    accent="accent-emerald-500"
                                    onChange={(v) => setPreshowTransition({ duration: v })}
                                />
                                <LabeledSlider
                                    label={t('modal.settings.segueDuration')}
                                    value={segueDuration} min={100} max={3000} step={100}
                                    display={`${segueDuration}ms`}
                                    accent="accent-orange-500"
                                    onChange={(v) => setSegueDuration(v)}
                                />
                            </section>
                        </div>
                    )}

                    {/* ── TAB: MICROFONO ── */}
                    {activeTab === 'mic' && (
                        <div className="p-6 space-y-6">

                            {/* SMART MIC — DUCKING */}
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <SectionTitle color="text-red-400">Smart Mic — Auto-Ducking</SectionTitle>
                                    <Toggle
                                        enabled={micEnabled}
                                        onToggle={() => setMicSettings({ enabled: !micEnabled })}
                                        labelOn="Abilitato"
                                        labelOff="Off"
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-600 italic">Il microfono monitora il parlato e abbassa automaticamente la musica, senza passare da una clip voce.</p>
                                <div className={`space-y-3 transition-opacity ${micEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
                                    <div>
                                        <span className="text-xs text-zinc-400 block mb-1">Dispositivo di Input</span>
                                        <select
                                            value={micInputDeviceId}
                                            onChange={e => setMicSettings({ inputDeviceId: e.target.value })}
                                            className="sel"
                                        >
                                            <option value="default">Microfono Predefinito</option>
                                            {inputDevices.map(d => (
                                                <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-zinc-600 mt-1">Microfono USB, Rødecaster, Zoom LiveTrak, Focusrite ecc. appaiono qui automaticamente.</p>
                                    </div>
                                    <LabeledSlider
                                        label="Soglia Attivazione Noise Gate"
                                        value={micThresholdDb}
                                        min={-60} max={-10} step={1}
                                        display={`${micThresholdDb} dBFS`}
                                        accent="accent-red-500"
                                        onChange={v => setMicSettings({ thresholdDb: v })}
                                    />
                                    <p className="text-[10px] text-zinc-600 -mt-2 italic">
                                        Rilascio a {micThresholdDb - 12} dBFS (isteresi fissa 12 dB). Default: -30 dBFS.
                                    </p>
                                    <LabeledSlider
                                        label="Hold attivazione (ms sopra soglia prima del ducking)"
                                        value={micActivationHoldMs}
                                        min={10} max={500} step={10}
                                        display={`${micActivationHoldMs} ms`}
                                        accent="accent-red-500"
                                        onChange={v => setMicSettings({ activationHoldMs: v })}
                                    />
                                    <LabeledSlider
                                        label="Hold rilascio (ms sotto soglia prima dello stop ducking)"
                                        value={micReleaseHoldMs}
                                        min={100} max={5000} step={100}
                                        display={`${micReleaseHoldMs} ms`}
                                        accent="accent-orange-500"
                                        onChange={v => setMicSettings({ releaseHoldMs: v })}
                                    />
                                    <p className="text-[10px] text-zinc-600 -mt-2 italic">
                                        Con mixer USB (Rødecaster, Zoom LiveTrak ecc.) che applicano loopback dell'audio del PC, alzare la soglia a -20/-15 dBFS o aumentare l'hold di attivazione a 200–500 ms per evitare trigger da bleed involontario.
                                    </p>
                                </div>
                            </section>

                            <Divider />

                            {/* CANALE MIX MICROFONO */}
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <SectionTitle color="text-red-400">Canale Mix Microfono</SectionTitle>
                                    <Toggle
                                        enabled={micMixEnabled}
                                        onToggle={() => setMicSettings({ mixEnabled: !micMixEnabled })}
                                        labelOn="In Mix"
                                        labelOff="Mute"
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-400 italic">Invia la voce dell'operatore direttamente al master bus dell'applicazione.</p>

                                <div className={`space-y-3 transition-opacity ${micMixEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
                                    <LabeledSlider
                                        label="Volume Microfono"
                                        value={micVolume}
                                        min={0} max={1} step={0.01}
                                        display={`${Math.round(micVolume * 100)}%`}
                                        accent="accent-red-500"
                                        onChange={v => setMicSettings({ volume: v })}
                                    />
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-400">Bypass Master Chain</span>
                                        <Toggle
                                            enabled={micBypassProcessing}
                                            onToggle={() => setMicSettings({ bypassProcessing: !micBypassProcessing })}
                                        />
                                    </div>
                                    <p className="text-[10px] text-zinc-500 italic -mt-1">
                                        {micBypassProcessing
                                            ? '⚠️ Voce raw all\'uscita (zero latenza, no effetti).'
                                            : '✨ Voce processata (HPF + Compressor + Limiter).'}
                                    </p>
                                </div>

                                {/* FEEDBACK WARNING (v1.1.2) */}
                                {micFeedbackAcknowledged ? (
                                    <div className="p-2 bg-zinc-800/50 border border-zinc-700 rounded text-[9px] text-zinc-500 flex gap-2 items-center">
                                        <span className="shrink-0">✓</span>
                                        <span>Rischio feedback: usa cuffie o mixer professionale.</span>
                                        <button
                                            onClick={() => setMicSettings({ feedbackAcknowledged: false })}
                                            className="ml-auto text-zinc-600 hover:text-zinc-400 underline whitespace-nowrap"
                                        >
                                            Rileggi avviso
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-[9px] text-yellow-200 space-y-2">
                                        <div className="flex gap-2">
                                            <span className="shrink-0">⚠️</span>
                                            <span>
                                                <strong>RISCHIO FEEDBACK:</strong> Se usi le casse, l'audio del mic potrebbe rientrare nel mix creando fischi.
                                                Usa sempre le <strong>cuffie</strong> se il canale Mix è attivo.
                                                I mixer professionali (Rødecaster, ecc.) con routing interno non hanno questo rischio.
                                            </span>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={micFeedbackAcknowledged}
                                                onChange={e => setMicSettings({ feedbackAcknowledged: e.target.checked })}
                                                className="w-3 h-3 accent-yellow-500"
                                            />
                                            <span className="text-yellow-300">Ho capito. Uso cuffie o un mixer professionale.</span>
                                        </label>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                    {/* ── TAB: REGISTRAZIONE ── */}
                    {activeTab === 'recording' && (
                        <div className="p-6 space-y-6">
                            <section className="space-y-4">
                                <SectionTitle color="text-zinc-400">Session Recording</SectionTitle>
                                <p className="text-[10px] text-zinc-600 italic">
                                    La registrazione cattura tutto ciò che senti in uscita — inclusi microfono (se armato e in mix) ed effetti master.
                                    Il formato e la qualità si scelgono al momento dell'esportazione.
                                </p>

                                <div className="card space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-xs font-bold text-zinc-300">Tap point: dopo il Limiter</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-600 italic">Il segnale registrato è fedele all'onda radio: passa per HPF, Compressore e Limiter brickwall.</p>
                                    <div className="flex gap-6 mt-2">
                                        <div>
                                            <span className="text-[9px] text-zinc-600 uppercase font-bold block">Formati disponibili</span>
                                            <span className="text-xs text-zinc-300 font-mono">WAV · FLAC · MP3 · OGG · WEBM</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-zinc-600 uppercase font-bold block">Qualità interna</span>
                                            <span className="text-xs text-zinc-300 font-mono">Opus 320 kbps</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-xs text-zinc-400 block mb-1">Formato predefinito apertura dialog</span>
                                    <select
                                        value={recordingFormat}
                                        onChange={e => setRecordingSettings({ format: e.target.value as 'webm' | 'wav' })}
                                        className="sel"
                                    >
                                        <option value="wav">WAV (Lossless)</option>
                                        <option value="webm">WebM / Opus (Broadcast Quality)</option>
                                    </select>
                                    <p className="text-[10px] text-zinc-600 mt-1 italic">Formato preselezionato all'apertura della finestra di esportazione.</p>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* ── TAB: MASTER CHAIN ── */}
                    {activeTab === 'chain' && (
                        <div className="p-6 space-y-5">
                            {/* OMOLOGAZIONE VOLUME CLIP */}
                            <div className="space-y-3 card !p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-medium text-zinc-300">Omologazione Volume Clip</span>
                                        <p className="text-[10px] text-zinc-600 mt-0.5 italic">Allinea automaticamente il volume percepito tra le clip (loudness EBU R128), con un guadagno statico — niente compressione, niente pompaggio.</p>
                                    </div>
                                    <Toggle enabled={loudnessNormEnabled} onToggle={() => setLoudnessNorm({ enabled: !loudnessNormEnabled })} />
                                </div>
                                <LabeledSlider
                                    label="Target loudness"
                                    value={loudnessTargetLufs} min={-23} max={-12} step={1}
                                    display={`${loudnessTargetLufs} LUFS`}
                                    accent="accent-emerald-500"
                                    disabled={!loudnessNormEnabled}
                                    onChange={(v) => setLoudnessNorm({ targetLufs: v })}
                                />
                                <p className="text-[10px] text-zinc-600 italic">Misurata una volta per clip (in background) e salvata nel progetto. Guadagno limitato a ±9 dB. Default: -16 LUFS.</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-[10px] uppercase text-sky-400 font-bold tracking-wider">Master Chain</h3>
                                    <p className="text-[10px] text-zinc-600 mt-0.5 italic">Pipeline broadcast-grade: HPF → Glue Multibanda → Limiter brickwall sul master bus.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-zinc-400">{masterChain.enabled ? 'Attiva' : 'Bypass'}</span>
                                    <Toggle enabled={masterChain.enabled} onToggle={() => setMasterChain({ enabled: !masterChain.enabled })} />
                                </div>
                            </div>

                            {/* HPF */}
                            <div className={`space-y-3 card !p-3 transition-opacity ${masterChain.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-zinc-300">HPF — High-Pass Filter</span>
                                    <Toggle enabled={masterChain.hpfEnabled} onToggle={() => setMasterChain({ hpfEnabled: !masterChain.hpfEnabled })} />
                                </div>
                                <LabeledSlider
                                    label="Frequenza di taglio"
                                    value={masterChain.hpfFrequency} min={20} max={200} step={5}
                                    display={`${masterChain.hpfFrequency} Hz`}
                                    accent="accent-sky-500"
                                    disabled={!masterChain.hpfEnabled}
                                    onChange={(v) => setMasterChain({ hpfFrequency: v })}
                                />
                                <p className="text-[10px] text-zinc-600 italic">Elimina rumble, fruscio basso, DC offset. Default: 30 Hz (preserva il calore dei bassi).</p>
                            </div>

                            {/* GLUE MULTIBANDA */}
                            <div className={`space-y-3 card !p-3 transition-opacity ${masterChain.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-zinc-300">Glue Multibanda — Calore & Morbidezza</span>
                                    <Toggle enabled={masterChain.compressorEnabled} onToggle={() => setMasterChain({ compressorEnabled: !masterChain.compressorEnabled })} />
                                </div>
                                <p className="text-[10px] text-zinc-600 italic">Compressore a 3 bande (basse/medie/alte) con preset gentile tarato: allinea le dinamiche e dà calore senza alzare il volume né indurire il suono. Quando disattivo, il segnale passa pulito (solo HPF + Limiter di sicurezza).</p>
                            </div>

                            {/* LIMITER */}
                            <div className={`space-y-3 card !p-3 transition-opacity ${masterChain.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-zinc-300">Limiter Brickwall</span>
                                    <span className="text-[10px] text-zinc-600 italic">Sempre attivo se chain abilitata</span>
                                </div>
                                <LabeledSlider
                                    label="Soglia massima"
                                    value={masterChain.limiterThreshold} min={-6} max={-0.1} step={0.1}
                                    display={`${masterChain.limiterThreshold.toFixed(1)} dBFS`}
                                    accent="accent-red-500"
                                    onChange={(v) => setMasterChain({ limiterThreshold: v })}
                                />
                                <p className="text-[10px] text-zinc-600 italic">Blocco assoluto per protezione trasmittente. 20:1, 2 ms att. Default: -1 dBFS.</p>
                            </div>

                            <button
                                onClick={() => setMasterChain({ ...DEFAULT_MASTER_CHAIN })}
                                className="text-[10px] text-zinc-600 hover:text-zinc-300 underline transition-colors"
                            >
                                ↺ Ripristina default Master Chain
                            </button>
                        </div>
                    )}

                </div>

                {/* FOOTER */}
                <div className="ov-foot">
                    <button onClick={onClose} className="btn btn-green">
                        {t('modal.settings.done')}
                    </button>
                </div>
            </div>
        </div>
    );
};
