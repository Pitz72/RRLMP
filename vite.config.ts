import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './',
    root: resolve(__dirname, 'src/renderer'),
    publicDir: 'public',
    build: {
        outDir: resolve(__dirname, 'out/renderer'),
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src/renderer/src'),
        },
    },
    server: {
        port: 5173,
        strictPort: true,
    },
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    }
});
