import { test, expect } from '@playwright/test';

test('credits Ilker Binzet and persists manual dark mode over the system theme', async ({
    page,
}) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.getByText('Ilker Binzet', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'LinkedIn', exact: true })).toHaveAttribute(
        'href',
        'https://ca.linkedin.com/in/binzet-me',
    );
    await expect(page.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute(
        'href',
        'https://github.com/ilker-binzet',
    );
    await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
    await expect(page.locator('.owp')).toHaveAttribute('data-theme', 'dark');
    expect(await page.locator('.owp').evaluate(el => getComputedStyle(el).backgroundColor)).toBe(
        'rgb(21, 36, 31)',
    );
    await page.reload();
    await expect(page.getByLabel('Appearance', { exact: true })).toHaveValue('dark');
    await expect(page.locator('.owp')).toHaveAttribute('data-theme', 'dark');
    await page.getByLabel('Appearance', { exact: true }).selectOption('system');
    await expect(page.locator('.owp')).toHaveAttribute('data-theme', 'light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('.owp')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: 'Find Work Windows' }).click();
    await expect(page.getByText('Matches Your Limits', { exact: true }).first()).toBeVisible();
});

test('finds real computed windows and explains every interval', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page).toHaveTitle(/Outdoor Work Planner/);
    await expect(page.getByText('Preview · sample forecast', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Find Work Windows' }).click();
    await expect(page.getByRole('heading', { name: 'Work Windows', exact: true })).toBeVisible();
    await expect(page.getByText('Matches Your Limits', { exact: true }).first()).toBeVisible();
    await page.getByText('All forecast intervals').click();
    await expect(page.getByText('Humidity exceeds your limit').first()).toBeVisible();
    expect(errors).toEqual([]);
});

test('recalculates edits, persists profile limits, and shows a no-match state', async ({
    page,
}) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Limits', exact: true }).click();
    await page.getByLabel('Maximum Wind', { exact: true }).fill('0');
    await page.getByRole('tab', { name: 'Plan', exact: true }).click();
    await page.getByRole('button', { name: 'Find Work Windows' }).click();
    await expect(page.getByText('No Matching Windows', { exact: true })).toBeVisible();
    await page.reload();
    await page.getByRole('tab', { name: 'Limits', exact: true }).click();
    await expect(page.getByLabel('Maximum Wind', { exact: true })).toHaveValue('0');
    await page.getByRole('tab', { name: 'Plan', exact: true }).click();
    await page.getByLabel('Work Profile', { exact: true }).selectOption('roofing');
    await page.getByRole('tab', { name: 'Limits', exact: true }).click();
    await expect(page.getByLabel('Maximum Wind', { exact: true })).toHaveValue('20');
    await page.getByRole('tab', { name: 'Plan', exact: true }).click();
    await page.getByLabel('Work Profile', { exact: true }).selectOption('painting');
    await page.getByRole('tab', { name: 'Limits', exact: true }).click();
    await expect(page.getByLabel('Maximum Wind', { exact: true })).toHaveValue('0');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(page.getByLabel('Maximum Wind', { exact: true })).toHaveValue('20');
});

test('does not show stale results after invalid input', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Find Work Windows' }).click();
    await page.getByRole('tab', { name: 'Plan', exact: true }).click();
    await page.getByLabel('Required Duration', { exact: true }).fill('0');
    await expect(page.getByRole('button', { name: 'Find Work Windows' })).toBeDisabled();
    await expect(page.getByText('Matches Your Limits', { exact: true })).toHaveCount(0);
    await expect(
        page
            .getByRole('tabpanel', { name: 'Plan', exact: true })
            .getByText('Required duration must be greater than 0 and no more than 24 hours.'),
    ).toBeVisible();
});

test('handles missing forecast fields and a failed request', async ({ page }) => {
    await page.goto('/?scenario=missing');
    await page.getByRole('button', { name: 'Find Work Windows' }).click();
    await expect(page.getByText('Data Unavailable', { exact: true }).first()).toBeVisible();
    await page.goto('/?scenario=error');
    await expect(page.getByRole('alert')).toContainText('Unable to load the forecast');
    await page.getByRole('button', { name: 'Try Again' }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.getByRole('button', { name: 'Find Work Windows' }).click();
    await expect(page.getByText('Matches Your Limits', { exact: true }).first()).toBeVisible();
});

test('changes a work location without a separate account', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Change', exact: true }).click();
    await page.getByText('Enter coordinates', { exact: true }).click();
    await page.getByLabel('Latitude', { exact: true }).fill('40');
    await page.getByLabel('Longitude', { exact: true }).fill('29');
    await page.getByRole('button', { name: 'Use Location' }).click();
    await expect(page.getByText('40.00° N, 29.00° E', { exact: false }).first()).toBeVisible();
});

test('fits a mobile screen and supports keyboard controls', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByLabel('Work Profile', { exact: true }).focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Find Work Windows' }).click();
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByRole('heading', { name: 'Work Windows', exact: true })).toBeVisible();
});
