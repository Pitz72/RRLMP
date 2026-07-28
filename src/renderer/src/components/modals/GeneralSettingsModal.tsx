import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAudioStore } from '../../store/useAudioStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useTranslation } from 'react-i18next';
import { DEFAULT_MASTER_CHAIN } from '../../engine/AudioContextManager';
import { FlagIcon } from '../ui/FlagIcon';
import { RemoteControlStatus } from '../../types';
import { MIC_ARM_ENABLED } from '../../utils/featureFlags';
import { toast } from '../../store/useToastStore';

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
        recordingFormat, setRecordingSettings,
        hiddenColumnIds, toggleColumnVisibility
    } = useSettingsStore();
    const updateOutputDevice = useAudioStore(s => s.updateOutputDevice);
    // Layout regia configurabile (v1.9.8) — elenco colonne (escluso FX = pad dedicato)
    const columns = useProjectStore(s => s.columns);
    const [devices, setDevices] = useState<AudioDevice[]>([]);
    const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    // Controllo Remoto (2026-07-01, Step 1/N) — stato letto dal main a ogni apertura
    // della modale; niente persistenza in useSettingsStore, il server riparte SEMPRE
    // spento a ogni avvio dell'app (nessun opt-in di rete automatico e silenzioso).
    const [remoteStatus, setRemoteStatus] = useState<RemoteControlStatus>({ running: false });
    const [remoteToggleBusy, setRemoteToggleBusy] = useState(false);
    const [remoteUrlCopied, setRemoteUrlCopied] = useState(false);

    useEffect(() => {
        if (!isOpen || !window.electron?.remoteControlStatus) return;
        window.electron.remoteControlStatus().then(setRemoteStatus).catch(() => {});
    }, [isOpen]);

    // v1.15.25 (M8): `listen` fallisce in modo ASINCRONO — la porta occupata da una
    // seconda istanza o da un altro programma si scopre dopo che l'avvio ha già
    // risposto "acceso". Senza questo canale il toggle restava acceso su un server
    // morto, senza alcun messaggio: si provava a collegare il tablet e non funzionava
    // niente, senza capire perché.
    useEffect(() => {
        if (!window.electron?.onRemoteControlFailed) return;
        return window.electron.onRemoteControlFailed(({ message }) => {
            setRemoteStatus({ running: false });
            setRemoteToggleBusy(false);
            toast(t('modal.settings.remoteFailed', 'Controllo Remoto non avviato: {{err}}', { err: message }), 'error', 8000);
        });
    }, [t]);

    // Copia l'URL del server remoto (es. per incollarlo in Telegram e aprirlo dal
    // tablet con un tap). Stesso pattern robusto del COPY del Debug Overlay
    // (v1.4.1): navigator.clipboard può rigettare per permesso/focus -> fallback
    // execCommand su una textarea temporanea, mai un errore mostrato all'utente.
    const handleCopyRemoteUrl = async () => {
        const address = remoteStatus.addresses?.[0];
        if (!address || !remoteStatus.port) return;
        const url = `http://${address}:${remoteStatus.port}`; // v1.11.3: il server è HTTP puro (da v1.9.1); il commento HTTPS era un residuo del prototipo PWA
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                throw new Error('clipboard API non disponibile');
            }
        } catch {
            try {
                const ta = document.createElement('textarea');
                ta.value = url;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            } catch { /* ultima istanza: nessun blocco all'utente */ }
        }
        setRemoteUrlCopied(true);
        setTimeout(() => setRemoteUrlCopied(false), 2000);
    };

    const handleToggleRemoteControl = async () => {
        if (!window.electron?.remoteControlStart || !window.electron?.remoteControlStop) return;
        setRemoteToggleBusy(true);
        try {
            const next = remoteStatus.running
                ? await window.electron.remoteControlStop()
                : await window.electron.remoteControlStart();
            setRemoteStatus(next);
        } finally {
            setRemoteToggleBusy(false);
        }
    };

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

    // v1.11.1: tab Microfono dietro MIC_ARM_ENABLED (vedi utils/featureFlags.ts) —
    // il pannello resta nel JSX ma senza tab non è raggiungibile.
    const tabs: { id: SettingsTab; label: string; icon: string }[] = [
        { id: 'general',   label: t('modal.settings.tab.general', 'Generali'),     icon: '⚙️' },
        { id: 'audio',     label: t('modal.settings.tab.audio', 'Audio & Mix'),    icon: '🎚️' },
        { id: 'mic',       label: t('modal.settings.tab.mic', 'Microfono'),        icon: '🎙️' },
        { id: 'recording', label: t('modal.settings.tab.recording', 'Registrazione'), icon: '⏺' },
        { id: 'chain',     label: t('modal.settings.tab.chain', 'Master Chain'),   icon: '⛓️' },
    ].filter(tab => MIC_ARM_ENABLED || tab.id !== 'mic') as { id: SettingsTab; label: string; icon: string }[];

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
                            {/* Task 1 (v1.10.15): due colonne — opzioni indipendenti.
                                md: → sotto i 768px di viewport il grid collassa a colonna singola.
                                v1.11.4 (rifinitura): Controllo Remoto spostato nella colonna
                                sinistra sotto Lingua — prima era full-width sotto il grid e
                                finiva sempre sotto scroll, mentre la colonna sinistra aveva
                                spazio morto (Layout regia è la sezione più alta). */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 items-start">
                            <div className="space-y-6">
                            <section>
                                <SectionTitle color="text-violet-400">{t('modal.settings.tab.language')}</SectionTitle>
                                <p className="text-[10px] text-zinc-600 italic mb-3">{t('modal.settings.languageHelp', "Seleziona la lingua dell'interfaccia. La modifica è immediata.")}</p>
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

                            <Divider />

                            {/* CONTROLLO REMOTO (2026-07-01, Step 1/N) — server LAN opt-in */}
                            <section className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <SectionTitle color="text-sky-400">{t('modal.settings.remoteControlTitle', 'Controllo Remoto (Beta)')}</SectionTitle>
                                        <p className="text-[10px] text-zinc-600 mt-0.5 italic">{t('modal.settings.remoteControlDesc', "Server locale in rete (LAN) per comandare l'app da un tablet/PC secondario: STOP ALL e play/stop della colonna Music.")}</p>
                                    </div>
                                    <Toggle
                                        enabled={remoteStatus.running}
                                        onToggle={remoteToggleBusy ? () => {} : handleToggleRemoteControl}
                                        labelOn={t('modal.settings.remoteToggleOn', 'Attivo')}
                                        labelOff={t('modal.settings.remoteToggleOff', 'Spento')}
                                    />
                                </div>
                                {remoteStatus.running && (
                                    <div className="card !p-3 space-y-2">
                                        <p className="text-xs text-zinc-300">{t('modal.settings.remotePinLabel', 'PIN')}: <span className="font-mono text-sky-400 text-sm tracking-widest">{remoteStatus.pin}</span></p>
                                        <p className="text-xs text-zinc-400">{t('modal.settings.remotePortLabel', 'Porta')}: <span className="font-mono">{remoteStatus.port}</span></p>
                                        {remoteStatus.addresses && remoteStatus.addresses.length > 0 && (
                                            <>
                                                <p className="text-xs text-zinc-400">{t('modal.settings.remoteLanAddresses', 'Indirizzi LAN')}: <span className="font-mono">{remoteStatus.addresses.join(', ')}</span></p>
                                                <button
                                                    onClick={() => void handleCopyRemoteUrl()}
                                                    className="!w-auto px-3 py-1.5 text-xs"
                                                >
                                                    {remoteUrlCopied ? t('modal.settings.remoteLinkCopied', '✓ Copiato') : t('modal.settings.remoteCopyLink', 'Copia link (http://{{address}}:{{port}})', { address: remoteStatus.addresses[0], port: remoteStatus.port })}
                                                </button>
                                            </>
                                        )}
                                        <p className="text-[10px] text-zinc-600 italic">{t('modal.settings.remoteControlHint', 'Apri il link nel browser del tablet/PC secondario (stessa rete) e inserisci il PIN; il pulsante "Schermo intero" nella pagina toglie la barra del browser. Utile inviare il link via Telegram/WhatsApp invece di digitarlo a mano. Il server si ferma automaticamente alla chiusura dell\'app.')}</p>
                                    </div>
                                )}
                            </section>
                            </div>

                            {/* LAYOUT REGIA — colonne visibili (Step 4 UI regia, v1.9.8) */}
                            <section className="space-y-3">
                                <SectionTitle color="text-amber-400">{t('modal.settings.layoutColumnsTitle', 'Layout regia — colonne')}</SectionTitle>
                                <p className="text-[10px] text-zinc-600 -mt-2 italic">{t('modal.settings.layoutColumnsDesc', 'Attiva o disattiva le colonne mostrate nella board, secondo le necessità della trasmissione. Preferenza globale (vale per tutti i progetti). Nascondere una colonna NON elimina le sue clip: restano nel progetto e ricompaiono riattivandola. Gli FX hanno il loro pad dedicato.')}</p>
                                <div className="space-y-2">
                                    {columns.filter(c => c.type !== 'sfx').map(col => {
                                        const visible = !hiddenColumnIds.includes(col.id);
                                        return (
                                            <div key={col.id} className="card !p-3 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: col.customColor || col.color }} />
                                                    <span className="text-sm text-zinc-200 truncate">{col.title}</span>
                                                </div>
                                                <Toggle
                                                    enabled={visible}
                                                    onToggle={() => toggleColumnVisibility(col.id)}
                                                    labelOn={t('modal.settings.columnVisible', 'Visibile')}
                                                    labelOff={t('modal.settings.columnHidden', 'Nascosta')}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                            </div>
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
                                <p className="text-[10px] text-zinc-600 mt-1">{t('modal.settings.outputDeviceHelp', "Seleziona la scheda audio (es. Rødecaster). L'audio si sposta immediatamente.")}</p>
                            </section>

                            <Divider />

                            {/* Task 1 (v1.10.15): due colonne — mixing | transizioni, opzioni indipendenti */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 items-start">
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
                                <p className="text-[10px] text-zinc-600 -mt-2 italic">{t('modal.settings.duckingReductionHelp', 'Volume musica quando lo speaker parla. 20% è lo standard radiofonico.')}</p>
                                <LabeledSlider
                                    label={t('modal.settings.duckingSpeed')}
                                    value={duckingDuration} min={0} max={2000} step={50}
                                    display={`${duckingDuration}ms`}
                                    accent="accent-emerald-500"
                                    onChange={(v) => setDuckingSettings({ duration: v })}
                                />
                                <p className="text-[10px] text-zinc-600 -mt-2 italic">{t('modal.settings.duckingSpeedHelp', 'Più alto = transizione più morbida.')}</p>
                            </section>

                            {/* TRANSIZIONI */}
                            <section className="space-y-4">
                                <SectionTitle color="text-emerald-500">{t('modal.settings.defaultTransition')}</SectionTitle>
                                <select
                                    value={defaultPreshowTransition}
                                    onChange={(e) => setDefaultPreshowTransition(e.target.value as 'crossfade' | 'segue' | 'gapless')}
                                    className="sel"
                                >
                                    <option value="crossfade">{t('modal.settings.transitionCrossfade', 'Crossfade (Sfumatura Incrociata)')}</option>
                                    <option value="segue">{t('modal.settings.transitionSegue', 'Segue / Cold Start (Subito Pieno, Prec. Sfuma)')}</option>
                                    <option value="gapless">{t('modal.settings.transitionGapless', 'Gapless (Taglio Netto / No Fade)')}</option>
                                </select>
                                <p className="text-[10px] text-zinc-600 -mt-2 italic">{t('modal.settings.transitionHelp', 'Transizione automatica tra clip consecutive con play_next.')}</p>
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
                        </div>
                    )}

                    {/* ── TAB: MICROFONO ── */}
                    {activeTab === 'mic' && (
                        <div className="p-6 space-y-6">

                            {/* Task 1 (v1.10.15): due colonne — ducking | canale mix, opzioni indipendenti */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 items-start">
                            {/* SMART MIC — DUCKING */}
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <SectionTitle color="text-red-400">{t('modal.settings.smartMicTitle', 'Smart Mic — Auto-Ducking')}</SectionTitle>
                                    <Toggle
                                        enabled={micEnabled}
                                        onToggle={() => setMicSettings({ enabled: !micEnabled })}
                                        labelOn={t('modal.settings.micEnabledOn', 'Abilitato')}
                                        labelOff={t('modal.settings.micEnabledOff', 'Off')}
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-600 italic">{t('modal.settings.smartMicDesc', 'Il microfono monitora il parlato e abbassa automaticamente la musica, senza passare da una clip voce.')}</p>
                                <div className={`space-y-3 transition-opacity ${micEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
                                    <div>
                                        <span className="text-xs text-zinc-400 block mb-1">{t('modal.settings.micInputDeviceLabel', 'Dispositivo di Input')}</span>
                                        <select
                                            value={micInputDeviceId}
                                            onChange={e => setMicSettings({ inputDeviceId: e.target.value })}
                                            className="sel"
                                        >
                                            <option value="default">{t('modal.settings.micDefaultDevice', 'Microfono Predefinito')}</option>
                                            {inputDevices.map(d => (
                                                <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-zinc-600 mt-1">{t('modal.settings.micInputDeviceHelp', 'Microfono USB, Rødecaster, Zoom LiveTrak, Focusrite ecc. appaiono qui automaticamente.')}</p>
                                    </div>
                                    <LabeledSlider
                                        label={t('modal.settings.micThresholdLabel', 'Soglia Attivazione Noise Gate')}
                                        value={micThresholdDb}
                                        min={-60} max={-10} step={1}
                                        display={`${micThresholdDb} dBFS`}
                                        accent="accent-red-500"
                                        onChange={v => setMicSettings({ thresholdDb: v })}
                                    />
                                    <p className="text-[10px] text-zinc-600 -mt-2 italic">
                                        {t('modal.settings.micThresholdHelp', 'Rilascio a {{v}} dBFS (isteresi fissa 12 dB). Default: -30 dBFS.', { v: micThresholdDb - 12 })}
                                    </p>
                                    <LabeledSlider
                                        label={t('modal.settings.micActivationHoldLabel', 'Hold attivazione (ms sopra soglia prima del ducking)')}
                                        value={micActivationHoldMs}
                                        min={10} max={500} step={10}
                                        display={`${micActivationHoldMs} ms`}
                                        accent="accent-red-500"
                                        onChange={v => setMicSettings({ activationHoldMs: v })}
                                    />
                                    <LabeledSlider
                                        label={t('modal.settings.micReleaseHoldLabel', 'Hold rilascio (ms sotto soglia prima dello stop ducking)')}
                                        value={micReleaseHoldMs}
                                        min={100} max={5000} step={100}
                                        display={`${micReleaseHoldMs} ms`}
                                        accent="accent-orange-500"
                                        onChange={v => setMicSettings({ releaseHoldMs: v })}
                                    />
                                    <p className="text-[10px] text-zinc-600 -mt-2 italic">
                                        {t('modal.settings.micHoldHelp', "Con mixer USB (Rødecaster, Zoom LiveTrak ecc.) che applicano loopback dell'audio del PC, alzare la soglia a -20/-15 dBFS o aumentare l'hold di attivazione a 200–500 ms per evitare trigger da bleed involontario.")}
                                    </p>
                                </div>
                            </section>

                            {/* CANALE MIX MICROFONO */}
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <SectionTitle color="text-red-400">{t('modal.settings.micMixTitle', 'Canale Mix Microfono')}</SectionTitle>
                                    <Toggle
                                        enabled={micMixEnabled}
                                        onToggle={() => setMicSettings({ mixEnabled: !micMixEnabled })}
                                        labelOn={t('modal.settings.micMixOn', 'In Mix')}
                                        labelOff={t('modal.settings.micMixOff', 'Mute')}
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-400 italic">{t('modal.settings.micMixDesc', "Invia la voce dell'operatore direttamente al master bus dell'applicazione.")}</p>

                                <div className={`space-y-3 transition-opacity ${micMixEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
                                    <LabeledSlider
                                        label={t('modal.settings.micVolumeLabel', 'Volume Microfono')}
                                        value={micVolume}
                                        min={0} max={1} step={0.01}
                                        display={`${Math.round(micVolume * 100)}%`}
                                        accent="accent-red-500"
                                        onChange={v => setMicSettings({ volume: v })}
                                    />
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-400">{t('modal.settings.micBypassLabel', 'Bypass Master Chain')}</span>
                                        <Toggle
                                            enabled={micBypassProcessing}
                                            onToggle={() => setMicSettings({ bypassProcessing: !micBypassProcessing })}
                                        />
                                    </div>
                                    <p className="text-[10px] text-zinc-500 italic -mt-1">
                                        {micBypassProcessing
                                            ? t('modal.settings.micBypassOn', "⚠️ Voce raw all'uscita (zero latenza, no effetti).")
                                            : t('modal.settings.micBypassOff', '✨ Voce processata (HPF + Compressor + Limiter).')}
                                    </p>
                                </div>

                                {/* FEEDBACK WARNING (v1.1.2) */}
                                {micFeedbackAcknowledged ? (
                                    <div className="p-2 bg-zinc-800/50 border border-zinc-700 rounded text-[9px] text-zinc-500 flex gap-2 items-center">
                                        <span className="shrink-0">✓</span>
                                        <span>{t('modal.settings.micFeedbackAck', 'Rischio feedback: usa cuffie o mixer professionale.')}</span>
                                        <button
                                            onClick={() => setMicSettings({ feedbackAcknowledged: false })}
                                            className="ml-auto text-zinc-600 hover:text-zinc-400 underline whitespace-nowrap"
                                        >
                                            {t('modal.settings.micFeedbackReread', 'Rileggi avviso')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-[9px] text-yellow-200 space-y-2">
                                        <div className="flex gap-2">
                                            <span className="shrink-0">⚠️</span>
                                            <span>
                                                <strong>{t('modal.settings.micFeedbackWarnTitle', 'RISCHIO FEEDBACK:')}</strong> {t('modal.settings.micFeedbackWarnPart1', "Se usi le casse, l'audio del mic potrebbe rientrare nel mix creando fischi. Usa sempre le")} <strong>{t('modal.settings.micFeedbackWarnHeadphones', 'cuffie')}</strong> {t('modal.settings.micFeedbackWarnPart2', 'se il canale Mix è attivo. I mixer professionali (Rødecaster, ecc.) con routing interno non hanno questo rischio.')}
                                            </span>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={micFeedbackAcknowledged}
                                                onChange={e => setMicSettings({ feedbackAcknowledged: e.target.checked })}
                                                className="w-3 h-3 accent-yellow-500"
                                            />
                                            <span className="text-yellow-300">{t('modal.settings.micFeedbackConfirm', 'Ho capito. Uso cuffie o un mixer professionale.')}</span>
                                        </label>
                                    </div>
                                )}
                            </section>
                            </div>
                        </div>
                    )}

                    {/* ── TAB: REGISTRAZIONE ── */}
                    {activeTab === 'recording' && (
                        <div className="p-6 space-y-6">
                            <section className="space-y-4">
                                <SectionTitle color="text-zinc-400">{t('modal.settings.recordingTitle', 'Session Recording')}</SectionTitle>
                                <p className="text-[10px] text-zinc-600 italic">
                                    {t('modal.settings.recordingDesc', "La registrazione cattura tutto ciò che senti in uscita — inclusi microfono (se armato e in mix) ed effetti master. Il formato e la qualità si scelgono al momento dell'esportazione.")}
                                </p>

                                <div className="card space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-xs font-bold text-zinc-300">{t('modal.settings.recordingTapPoint', 'Tap point: dopo il Limiter')}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-600 italic">{t('modal.settings.recordingTapHint', "Il segnale registrato è fedele all'onda radio: passa per HPF, Compressore e Limiter brickwall.")}</p>
                                    <div className="flex gap-6 mt-2">
                                        <div>
                                            <span className="text-[9px] text-zinc-600 uppercase font-bold block">{t('modal.settings.recordingAvailableFormats', 'Formati disponibili')}</span>
                                            <span className="text-xs text-zinc-300 font-mono">WAV · FLAC · MP3 · OGG · WEBM</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-zinc-600 uppercase font-bold block">{t('modal.settings.recordingInternalQuality', 'Qualità interna')}</span>
                                            <span className="text-xs text-zinc-300 font-mono">Opus 320 kbps</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-xs text-zinc-400 block mb-1">{t('modal.settings.recordingDefaultFormatLabel', 'Formato predefinito apertura dialog')}</span>
                                    <select
                                        value={recordingFormat}
                                        onChange={e => setRecordingSettings({ format: e.target.value as 'webm' | 'wav' })}
                                        className="sel"
                                    >
                                        <option value="wav">{t('modal.settings.recordingFormatWav', 'WAV (Lossless)')}</option>
                                        <option value="webm">{t('modal.settings.recordingFormatWebm', 'WebM / Opus (Broadcast Quality)')}</option>
                                    </select>
                                    <p className="text-[10px] text-zinc-600 mt-1 italic">{t('modal.settings.recordingDefaultFormatHelp', "Formato preselezionato all'apertura della finestra di esportazione.")}</p>
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
                                        <span className="text-xs font-medium text-zinc-300">{t('modal.settings.chain.loudnessTitle', 'Omologazione Volume Clip')}</span>
                                        <p className="text-[10px] text-zinc-600 mt-0.5 italic">{t('modal.settings.chain.loudnessDesc', 'Allinea automaticamente il volume percepito tra le clip (loudness EBU R128), con un guadagno statico — niente compressione, niente pompaggio.')}</p>
                                    </div>
                                    <Toggle enabled={loudnessNormEnabled} onToggle={() => setLoudnessNorm({ enabled: !loudnessNormEnabled })} />
                                </div>
                                <LabeledSlider
                                    label={t('modal.settings.chain.targetLoudness', 'Target loudness')}
                                    value={loudnessTargetLufs} min={-23} max={-12} step={1}
                                    display={`${loudnessTargetLufs} LUFS`}
                                    accent="accent-emerald-500"
                                    disabled={!loudnessNormEnabled}
                                    onChange={(v) => setLoudnessNorm({ targetLufs: v })}
                                />
                                <p className="text-[10px] text-zinc-600 italic">{t('modal.settings.chain.loudnessHint', 'Misurata una volta per clip (in background) e salvata nel progetto. Guadagno limitato a ±9 dB. Default: -16 LUFS.')}</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-[10px] uppercase text-sky-400 font-bold tracking-wider">Master Chain</h3>
                                    <p className="text-[10px] text-zinc-600 mt-0.5 italic">{t('modal.settings.chain.pipelineDesc', 'Pipeline broadcast-grade: HPF → Glue Multibanda → Limiter brickwall sul master bus.')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-zinc-400">{masterChain.enabled ? t('modal.settings.chain.active', 'Attiva') : t('modal.settings.chain.bypass', 'Bypass')}</span>
                                    <Toggle enabled={masterChain.enabled} onToggle={() => setMasterChain({ enabled: !masterChain.enabled })} />
                                </div>
                            </div>

                            {/* Task 1 (v1.10.15): due colonne — card HPF/Glue/Limiter indipendenti.
                                v1.11.4 (rifinitura): items-stretch — la card HPF (corta) si
                                allinea in altezza alla Glue, prima restava un "gradino". */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                            {/* HPF */}
                            <div className={`space-y-3 card !p-3 transition-opacity ${masterChain.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-zinc-300">HPF — High-Pass Filter</span>
                                    <Toggle enabled={masterChain.hpfEnabled} onToggle={() => setMasterChain({ hpfEnabled: !masterChain.hpfEnabled })} />
                                </div>
                                <LabeledSlider
                                    label={t('modal.settings.chain.cutoffFreq', 'Frequenza di taglio')}
                                    value={masterChain.hpfFrequency} min={20} max={200} step={5}
                                    display={`${masterChain.hpfFrequency} Hz`}
                                    accent="accent-sky-500"
                                    disabled={!masterChain.hpfEnabled}
                                    onChange={(v) => setMasterChain({ hpfFrequency: v })}
                                />
                                <p className="text-[10px] text-zinc-600 italic">{t('modal.settings.chain.hpfHint', 'Elimina rumble, fruscio basso, DC offset. Default: 30 Hz (preserva il calore dei bassi).')}</p>
                            </div>

                            {/* GLUE MULTIBANDA */}
                            <div className={`space-y-3 card !p-3 transition-opacity ${masterChain.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-zinc-300">{t('modal.settings.chain.glueTitle', 'Glue Multibanda — Calore & Morbidezza')}</span>
                                    <Toggle enabled={masterChain.compressorEnabled} onToggle={() => setMasterChain({ compressorEnabled: !masterChain.compressorEnabled })} />
                                </div>
                                <p className="text-[10px] text-zinc-600 italic">{t('modal.settings.chain.glueDesc', 'Compressore a 3 bande (basse/medie/alte) con preset gentile tarato: allinea le dinamiche e dà calore senza alzare il volume né indurire il suono. Quando disattivo, il segnale passa pulito (solo HPF + Limiter di sicurezza).')}</p>

                                <div className={`transition-opacity ${masterChain.compressorEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
                                    <span className="text-[10px] uppercase text-zinc-500 tracking-wider">{t('modal.settings.chain.style', 'Stile')}</span>
                                    <select
                                        value={masterChain.compressorStyle}
                                        onChange={(e) => setMasterChain({ compressorStyle: e.target.value as typeof masterChain.compressorStyle })}
                                        className="sel"
                                    >
                                        <option value="neutro">{t('modal.settings.chain.styleNeutral', 'Neutro (default, tarato)')}</option>
                                        <option value="rock">{t('modal.settings.chain.styleRock', 'Rock — denso, punchy')}</option>
                                        <option value="jazz">{t('modal.settings.chain.styleJazz', 'Jazz — trasparente, dinamico')}</option>
                                        <option value="elettronico">{t('modal.settings.chain.styleElectronic', 'Elettronico — compatto, tirato')}</option>
                                    </select>
                                    <p className="text-[10px] text-zinc-600 mt-1 italic">{t('modal.settings.chain.styleHint', "Solo 'Neutro' è tarato con misura oggettiva (LUFS/LRA). Gli altri stili sono valori di partenza: verificare in regia con ascolto reale.")}</p>
                                </div>
                            </div>

                            {/* LIMITER */}
                            <div className={`space-y-3 card !p-3 transition-opacity ${masterChain.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-zinc-300">Limiter Brickwall</span>
                                    <span className="text-[10px] text-zinc-600 italic">{t('modal.settings.chain.limiterAlways', 'Sempre attivo se chain abilitata')}</span>
                                </div>
                                <LabeledSlider
                                    label={t('modal.settings.chain.maxThreshold', 'Soglia massima')}
                                    value={masterChain.limiterThreshold} min={-6} max={-0.1} step={0.1}
                                    display={`${masterChain.limiterThreshold.toFixed(1)} dBFS`}
                                    accent="accent-red-500"
                                    onChange={(v) => setMasterChain({ limiterThreshold: v })}
                                />
                                <p className="text-[10px] text-zinc-600 italic">{t('modal.settings.chain.limiterHint', 'Blocco assoluto per protezione trasmittente. 20:1, 2 ms att. Default: -1 dBFS.')}</p>
                            </div>
                            </div>

                            <button
                                onClick={() => setMasterChain({ ...DEFAULT_MASTER_CHAIN })}
                                className="text-[10px] text-zinc-600 hover:text-zinc-300 underline transition-colors"
                            >
                                ↺ {t('modal.settings.chain.resetDefault', 'Ripristina default Master Chain')}
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
