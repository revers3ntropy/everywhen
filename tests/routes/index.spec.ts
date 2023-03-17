import { expect, test } from '@playwright/test';
import { randStr } from '../helpers.js';

test.describe('/', () => {
    test('Has title', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/Diary/);
    });

    test('Can create account', async ({ page }) => {
        await page.goto('/');

        const auth = {
            username: randStr(),
            password: randStr(),
        };

        await page.locator('input[aria-label="Username"]')
                  .fill(auth.username);
        await page.locator('input[aria-label="Password"]')
                  .fill(auth.password);

        await page.locator('button[aria-label="Log In"]')
                  .click();

        await expect(page).toHaveURL('/');
    });
});

