import { expect, it, vi } from 'vitest';

it('loads the built plugin against the Windy global even when a dependency declares a local W', async () => {
    vi.stubGlobal('W', { map: { map: {} }, singleclick: { singleclick: {} }, store: {}, fetch: { getPointForecastData() {} }, reverseName: {} });
    try {
        const module = await import(new URL('../dist/plugin.js', import.meta.url).href);
        expect(typeof module.default).toBe('function');
    } finally { vi.unstubAllGlobals(); }
});
