import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from './helpers';

test.describe('/home', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/home', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/login?redirect=home');
    });

    test('Can view page', async ({ page }) => {
        const { api, auth } = await generateUserAndSignIn(page);
        await page.goto('/home', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/home');
        await expectDeleteUser(api, auth);
    });
});
