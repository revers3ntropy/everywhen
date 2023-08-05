import { expect, test } from '@playwright/test';

test.describe('/', () => {
    test('Has title', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        await expect(page).toHaveTitle(/Halcyon\.Land/);
    });
});
