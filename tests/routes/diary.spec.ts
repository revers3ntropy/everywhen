import { expect, test } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/diary');

    await expect(page).toHaveTitle(/Diary/);
});
