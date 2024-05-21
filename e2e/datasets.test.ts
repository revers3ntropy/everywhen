import { expect, test } from '@playwright/test';

test.describe('Datasets', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/datasets', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/login?redirect=datasets');
    });
});
