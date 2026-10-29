import { defineConfig } from 'vite';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({
    plugins: [svelte({ preprocess: vitePreprocess() })],
    build: { outDir: 'preview-dist' },
    server: { port: 5173, strictPort: true },
});
