import { expect, test } from '@playwright/test';
import { deleteUser, generateUser } from '../helpers.js';

test.describe('/', () => {
    test('Has title', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        await expect(page).toHaveTitle(/Halcyon\.Land/);
    });

    test('Can log into account', async ({ page }) => {
        const { auth, api } = await generateUser();
        await page.goto('/', { waitUntil: 'networkidle' });

        await page.getByLabel('Username').fill(auth.username);
        await page.getByLabel('Password').fill(auth.password);

        await page.getByRole('button', { name: 'Log In' }).click();

        await page.waitForURL('/home', { waitUntil: 'networkidle' });

        const { err } = await deleteUser(api);
        expect(err).toBe(null);

        await page.goto('/home', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/?redirect=home');
    });
});
