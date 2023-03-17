import { expect, test } from '@playwright/test';
import { randStr } from '../helpers.js';

test.describe('/', () => {
    test('Has title', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/Diary/);
    });

    test('Can create account with form', async ({ page }) => {
        await page.goto('/');

        const auth = {
            username: randStr(),
            password: randStr(),
        };

        expect(await page.isVisible('input[aria-label="Password"]'))
            .toBe(true);
        expect(await page.isVisible('input[aria-label="Username"]'))
            .toBe(true);
        expect(await page.isVisible('button[aria-label="Create Account"]'))
            .toBe(true);
        expect(await page.isVisible('button[aria-label="Log In"]'))
            .toBe(true);

        await page.getByLabel('Username').fill(auth.username);
        await page.getByLabel('Password').fill(auth.password);

        await page.getByRole('button', { name: 'Log In' }).click();

        // haven't been signed in with random credentials
        await expect(page).toHaveURL('/');

        await page.getByRole('button', { name: 'Create Account' })
                  .click();

        await page.goto('/home', { waitUntil: 'domcontentloaded' });

        await expect(page).toHaveURL('/home');

        expect(await page.isVisible('button[aria-label="Delete Account"]'))
            .toBe(true);

        await page.getByLabel('Delete Account').click();

        await page.getByLabel('Username').fill(auth.username);
        await page.getByLabel('Password').fill(auth.password);

        await page.getByRole('button', { name: 'Log In' }).click();
        await expect(await page.locator('.default-notification-error'))
            .toHaveCount(1);
    });
});

