import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from './helpers';

test.describe('/assets', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/assets', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/login?redirect=assets');
    });

    test('Can view page', async ({ page }) => {
        const { api, auth } = await generateUserAndSignIn(page);
        await page.goto('/assets', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/assets');
        await expectDeleteUser(api, auth);
    });
});
