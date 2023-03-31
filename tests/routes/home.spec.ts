import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from '../helpers.js';

test.describe('/home', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/home', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/');
    });

    test('Can view page', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        const { api } = await generateUserAndSignIn(page);
        await page.goto('/home', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/home');
        await expectDeleteUser(api, expect);
    });
});
