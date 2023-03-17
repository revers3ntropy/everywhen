import { expect, test } from '@playwright/test';

test.beforeAll(async ({ page }) => {
    await page.goto('/');
});

test('Has title', async ({ page }) => {
    await expect(page).toHaveTitle(/Diary/);
});

test('Can create account', async ({ page }) => {

    page.locator('');
});