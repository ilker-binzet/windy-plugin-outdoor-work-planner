import { test, expect } from '@playwright/test';

test('separates settings from results and keeps edits when returning from the map', async ({
    page,
}) => {
    await page.goto('/');
    await expect(page.getByRole('tab', { name: 'Plan', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
    );
    await expect(page.getByLabel('Maximum Wind', { exact: true })).toBeHidden();
    await page.getByRole('tab', { name: 'Limits', exact: true }).click();
    await page.getByLabel('Maximum Wind', { exact: true }).fill('17');
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Back to planner' })).toBeVisible();
    await page.getByRole('button', { name: 'Back to planner' }).click();
    await expect(page.getByLabel('Maximum Wind', { exact: true })).toHaveValue('17');
    await page.getByRole('tab', { name: 'Plan', exact: true }).click();
    await page.getByRole('button', { name: 'Find Work Windows' }).click();
    await expect(page.getByRole('tab', { name: 'Results', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
    );
    await expect(page.getByRole('heading', { name: 'Work Windows', exact: true })).toBeVisible();
});

test('scrolls all controls inside a clipped short mobile host', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    await page.addStyleTag({
        content: 'main { height: calc(100dvh - 24px) !important; overflow: hidden !important; }',
    });
    await page.getByRole('tab', { name: 'Limits', exact: true }).click();
    const content = page.getByRole('region', { name: 'Planner content', exact: true });
    await content.hover();
    await page.mouse.wheel(0, 900);
    await expect.poll(() => content.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Back to plan', exact: true }).click();
    await expect(page.getByRole('tab', { name: 'Plan', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
    );
});

test('reports a denied device location and keeps manual entry available', async ({ page }) => {
    await page.addInitScript(() =>
        Object.defineProperty(navigator, 'geolocation', {
            value: {
                getCurrentPosition(_ok: unknown, fail: (error: { code: number }) => void) {
                    fail({ code: 1 });
                },
            },
        }),
    );
    await page.goto('/');
    await page.getByRole('button', { name: 'Change', exact: true }).click();
    await page.getByRole('button', { name: 'Use my location', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Location permission');
    await page.getByText('Enter coordinates', { exact: true }).click();
    await page.getByLabel('Latitude', { exact: true }).fill('40');
    await page.getByLabel('Longitude', { exact: true }).fill('29');
    await page.getByRole('button', { name: 'Use Location', exact: true }).click();
    await expect(page.getByText('40.00° N, 29.00° E', { exact: false }).first()).toBeVisible();
});
