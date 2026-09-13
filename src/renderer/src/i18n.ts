import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import it from './locales/it.json';

// i18n main-process (2026-07-03): il main non ha accesso a i18next/localStorage —
// gli si notifica la lingua via IPC (dialoghi nativi, errori IPC, vedi i18nMain.ts).
// languageChanged scatta anche all'init → copre avvio E cambi da Impostazioni.
const notifyMainLanguage = (lng: string) => {
    try {
        window.electron?.setAppLanguage?.(lng);
    } catch { /* devMock/test: nessun bridge Electron */ }
};
i18n.on('languageChanged', notifyMainLanguage);

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            it: { translation: it },
        },
        // v1.15.32: solo italiano e inglese. Chi aveva salvato fr/de/es/pt/ru/zh
        // in localStorage non è più "supportato" → i18next ripiega su 'en' e il
        // detector memorizza la nuova scelta.
        supportedLngs: ['en', 'it'],
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage'],
            caches: ['localStorage'],
        },

    });

export default i18n;
