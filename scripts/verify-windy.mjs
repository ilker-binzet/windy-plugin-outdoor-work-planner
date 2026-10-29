import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// Test in the public Windy runtime without publishing or installing to an account.
// Browser routing serves our local bundle at a virtual development URL.
const browser = await chromium.launch({
    headless: true,
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined,
});
const page = await browser.newPage({ viewport: { width: 1500, height: 1050 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const evidence = process.env.OWP_EVIDENCE_DIR || '/tmp/outdoor-work-planner-evidence';
await mkdir(evidence, { recursive: true });
try {
    await page.route('https://localhost:9999/**', async route => {
        const file = new URL(route.request().url()).pathname.slice(1);
        if (!['plugin.js', 'plugin.min.js'].includes(file)) return route.abort();
        return route.fulfill({ status: 200, contentType: 'application/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, path: new URL('../dist/' + file, import.meta.url).pathname });
    });
    await page.goto('https://www.windy.com/?41.01,28.98,7', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.W?.fetch?.getPointForecastData, { timeout: 30000 });
    for (const filename of ['plugin.js', 'plugin.min.js']) {
        await page.evaluate(async filename => {
            const module = await import('https://localhost:9999/' + filename);
            const host = document.createElement('section');
            host.id = 'owp-live-test';
            host.style.cssText = 'position:fixed;right:0;top:0;width:520px;height:100vh;overflow-y:auto;z-index:100000;background:white;box-shadow:-1px 0 8px #0003';
            document.body.append(host);
            window.owpTest = new module.default({ target: host });
            window.owpTest.onopen?.({ lat: 41.01, lon: 28.98 });
        }, filename);
        const host = page.locator('#owp-live-test');
        await host.locator('.owp-find-button:not(:disabled)').waitFor({ timeout: 35000 });
        await host.locator('.owp-find-button').click();
        await host.locator('#results-title').waitFor();
        const content = await host.innerText();
        if (!content.includes('3-hour intervals') || content.includes('Sample data') || !content.includes('Ilker Binzet')) throw new Error('Live data/author metadata mismatch.');
        const banner = host.locator('.owp-window-banner').first();
        if (await banner.count()) {
            const box = await banner.boundingBox();
            if (!box || box.width < 400) throw new Error('Windy host CSS narrowed a result banner: ' + box?.width);
        }
        await page.screenshot({ path: `${evidence}/${filename}-light.png`, animations: 'disabled' });
        await host.locator('#appearance').selectOption('dark');
        if (await host.locator('.owp').getAttribute('data-theme') !== 'dark') throw new Error('Dark theme was not applied.');
        await page.screenshot({ path: `${evidence}/${filename}-dark.png`, animations: 'disabled' });
        console.log(JSON.stringify({ bundle: filename, liveForecast: true, darkMode: true, author: 'Ilker Binzet', result: content.slice(content.indexOf('Work Windows'), content.indexOf('All forecast intervals')) }));
        await page.evaluate(() => { window.owpTest.$destroy(); document.querySelector('#owp-live-test')?.remove(); });
    }
    if (errors.length) throw new Error('Browser runtime errors: ' + errors.join('; '));
    console.log('Live Windy mount, forecast, search, theme and destroy checks passed for both bundles.');
} catch (error) {
    await page.screenshot({ path: `${evidence}/failure.png`, animations: 'disabled' });
    throw error;
} finally { await browser.close(); }
