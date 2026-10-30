import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const platform = process.env.OWP_TEST_PLATFORM;
if (platform && !['mobile', 'desktop'].includes(platform))
    throw new Error('OWP_TEST_PLATFORM must be mobile or desktop.');

// Use Windy's real ExternalSveltePlugin window manager in an ephemeral, signed-out
// browser context. No account installation or publication takes place here.
const browser = await chromium.launch({
    headless: true,
    proxy: process.env.HTTPS_PROXY
        ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }
        : undefined,
});
const evidence = process.env.OWP_EVIDENCE_DIR || '/tmp/outdoor-work-planner-evidence';
await mkdir(evidence, { recursive: true });
try {
    for (const mobile of [false, true]) {
        if (platform && platform !== (mobile ? 'mobile' : 'desktop')) continue;
        for (const filename of ['plugin.js', 'plugin.min.js']) {
            const viewport = mobile ? { width: 390, height: 844 } : { width: 1500, height: 1050 };
            const context = await browser.newContext({
                viewport,
                isMobile: mobile,
                hasTouch: mobile,
                geolocation: { latitude: 40.7, longitude: -74 },
                permissions: ['geolocation'],
            });
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            const label = `${mobile ? 'mobile' : 'desktop'}-${filename}`;
            try {
                await page.route('https://localhost:9999/**', route => {
                    const file = new URL(route.request().url()).pathname.slice(1);
                    if (!['plugin.js', 'plugin.min.js'].includes(file)) return route.abort();
                    return route.fulfill({
                        status: 200,
                        contentType: 'application/javascript',
                        headers: { 'Access-Control-Allow-Origin': '*' },
                        path: new URL('../dist/' + file, import.meta.url).pathname,
                    });
                });
                await page.goto('https://www.windy.com/?41.01,28.98,7', {
                    waitUntil: 'domcontentloaded',
                    timeout: 30000,
                });
                await page.waitForFunction(
                    () => window.W?.ExternalSveltePlugin && window.W?.fetch?.getPointForecastData,
                    { timeout: 30000 },
                );
                await page.evaluate(async filename => {
                    const module = await import('https://localhost:9999/' + filename);
                    const config = {
                        ...module.__pluginConfig,
                        url: 'https://localhost:9999/' + filename,
                    };
                    const instance = new W.ExternalSveltePlugin.ExternalSveltePlugin(
                        { ident: config.name },
                        config,
                    );
                    instance.plugin = module;
                    instance.isLoaded = true;
                    W.plugins[config.name] = instance;
                    window.owpTest = instance;
                    // Mount via the native window/lifecycle implementation, without the
                    // gallery's update-check request or persistent installation.
                    await W.WindowPlugin.WindowPlugin.prototype.open.call(instance, {
                        params: { lat: 41.01, lon: 28.98 },
                        disableOpeningAnimation: true,
                    });
                }, filename);
                const host = page.locator('.owp-planner-host');
                await host.locator('.owp-find-button:not(:disabled)').waitFor({ timeout: 30000 });
                const bounds = await host.boundingBox();
                if (
                    !bounds ||
                    bounds.x < 0 ||
                    bounds.y < 0 ||
                    bounds.x + bounds.width > viewport.width ||
                    bounds.y + bounds.height > viewport.height
                )
                    throw new Error('Native panel is clipped: ' + JSON.stringify(bounds));
                await page.screenshot({
                    path: `${evidence}/${label}-plan.png`,
                    animations: 'disabled',
                });
                await host.screenshot({
                    path: `${evidence}/${label}-panel.jpg`,
                    type: 'jpeg',
                    quality: 92,
                    animations: 'disabled',
                });
                await host.getByRole('tab', { name: 'Limits', exact: true }).click();
                await host.getByLabel('Maximum Wind', { exact: true }).fill('17');
                const scroll = host.getByRole('region', { name: 'Planner content', exact: true });
                const centerBefore = await page.evaluate(() => W.map.map.getCenter());
                if (mobile) {
                    const box = await scroll.boundingBox();
                    const session = await context.newCDPSession(page);
                    const x = box.x + box.width / 2,
                        start = box.y + box.height - 35;
                    await session.send('Input.dispatchTouchEvent', {
                        type: 'touchStart',
                        touchPoints: [{ x, y: start }],
                    });
                    for (let n = 1; n <= 6; n++)
                        await session.send('Input.dispatchTouchEvent', {
                            type: 'touchMove',
                            touchPoints: [{ x, y: start - (n * (box.height - 100)) / 6 }],
                        });
                    await session.send('Input.dispatchTouchEvent', {
                        type: 'touchEnd',
                        touchPoints: [],
                    });
                    await session.detach();
                } else {
                    await scroll.hover();
                    await page.mouse.wheel(0, 700);
                }
                await expect.poll(() => scroll.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
                const centerAfter = await page.evaluate(() => W.map.map.getCenter());
                if (centerBefore.lat !== centerAfter.lat || centerBefore.lng !== centerAfter.lng)
                    throw new Error('Scrolling the planner moved the Windy map.');
                await host.getByLabel('Appearance', { exact: true }).selectOption('dark');
                await expect(host.locator('.owp')).toHaveAttribute('data-theme', 'dark');
                await host.getByRole('tab', { name: 'Limits', exact: true }).click();
                await page.screenshot({
                    path: `${evidence}/${label}-limits-dark.png`,
                    animations: 'disabled',
                });
                await host.screenshot({
                    path: `${evidence}/${label}-panel-dark.png`,
                    animations: 'disabled',
                });
                await host.getByRole('button', { name: 'Map', exact: true }).click();
                const mini = await host.boundingBox();
                if (
                    !mini ||
                    mini.y < 0 ||
                    mini.y + mini.height > viewport.height ||
                    mini.height > viewport.height * 0.6
                )
                    throw new Error('Map panel does not fit: ' + JSON.stringify(mini));
                await page.screenshot({
                    path: `${evidence}/${label}-map.png`,
                    animations: 'disabled',
                });
                const beforePoint = await host.locator('.owp-selected-place p').innerText();
                if (mobile) await page.touchscreen.tap(70, 250);
                else await page.mouse.click(600, 300);
                await expect
                    .poll(() => host.locator('.owp-selected-place p').innerText())
                    .not.toBe(beforePoint);
                await host.getByRole('button', { name: 'Use my location', exact: true }).click();
                await expect(host.locator('.owp-selected-place')).toContainText(
                    '40.70° N, 74.00° W',
                    { timeout: 15000 },
                );
                await host
                    .getByRole('button', { name: 'Search city or place in Windy', exact: true })
                    .click();
                await page.locator('#plugin-search').waitFor({ state: 'visible' });
                await page.locator('#q').click();
                await page.locator('#q').pressSequentially('Paris', { delay: 60 });
                await page
                    .locator('#plugin-search a.item--type-city')
                    .filter({ has: page.getByText('France', { exact: true }) })
                    .first()
                    .click({ timeout: 20000 });
                await expect(host.locator('.owp-selected-place')).toContainText(
                    '48.85° N, 2.35° E',
                    { timeout: 15000 },
                );
                await page.waitForFunction(
                    () => !W.plugins.search.isOpen && !W.plugins.detail.isOpen,
                    { timeout: 15000 },
                );
                await host.getByRole('button', { name: 'Back to planner', exact: true }).click();
                await expect(
                    host.getByRole('tab', { name: 'Limits', exact: true }),
                ).toHaveAttribute('aria-selected', 'true');
                await expect(host.getByLabel('Maximum Wind', { exact: true })).toHaveValue('17');
                await host.getByRole('tab', { name: 'Plan', exact: true }).click();
                await host.locator('.owp-find-button:not(:disabled)').waitFor({ timeout: 30000 });
                await host.getByRole('button', { name: 'Find Work Windows', exact: true }).click();
                await expect(
                    host.getByRole('heading', { name: 'Work Windows', exact: true }),
                ).toBeVisible();
                if ((await host.innerText()).includes('Sample data'))
                    throw new Error('Live host used a sample forecast.');
                await page.screenshot({
                    path: `${evidence}/${label}-results.png`,
                    animations: 'disabled',
                });
                await host
                    .getByRole('button', { name: 'Close planner and return to Windy', exact: true })
                    .click();
                await expect(page.locator('.owp')).toHaveCount(0);
                await expect(page.locator('.owp-native-window')).toHaveCount(0);
                await expect(page.locator('.owp-map-pin')).toHaveCount(0);
                if (errors.length) throw new Error('Runtime errors: ' + errors.join('; '));
                console.log(
                    JSON.stringify({
                        bundle: filename,
                        mobile,
                        nativeWindow: true,
                        realForecast: true,
                        scroll: true,
                        mapSelection: true,
                        emulatedGPS: true,
                        nativeCitySearch: true,
                        returnAndClose: true,
                        darkMode: true,
                    }),
                );
            } catch (error) {
                console.error(
                    await page
                        .locator('.owp-planner-host')
                        .evaluate(el => {
                            const nodes = [];
                            for (let n = el; n; n = n.parentElement) {
                                const s = getComputedStyle(n);
                                nodes.push({
                                    tag: n.tagName,
                                    cls: n.className,
                                    transform: s.transform,
                                    position: s.position,
                                    top: s.top,
                                    bottom: s.bottom,
                                    height: s.height,
                                    rect: n.getBoundingClientRect().toJSON(),
                                });
                            }
                            return nodes;
                        })
                        .catch(() => []),
                );
                await page.screenshot({
                    path: `${evidence}/${label}-failure.png`,
                    animations: 'disabled',
                });
                throw error;
            } finally {
                await context.close();
            }
        }
    }
    console.log('Selected real Windy lifecycle and interaction checks passed for both bundles.');
} finally {
    await browser.close();
}
