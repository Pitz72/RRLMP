import { defineConfig } from 'vitest/config';

// Config DEDICATA ai test automatici del motore audio (v1.4.5).
// Separata da vite.config / tsconfig di build: Vitest non partecipa al build di
// produzione (electron-builder usa `vite build`), quindi nessun impatto runtime.
// Environment jsdom perche': useSettingsStore usa `persist` (richiede localStorage)
// e i test mockano `window.electron` (assente in node puro).
export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./test/setup.ts'],
        include: ['src/**/*.test.ts'],
    },
});
