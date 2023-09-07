import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from './lib/helpers';

test.describe('/labels', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/labels', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/login?redirect=labels');
    });

    test('Can view page', async ({ page }) => {
        const { api, auth } = await generateUserAndSignIn(page);
        await page.goto('/labels', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/labels');
        await expectDeleteUser(api, auth);
    });
});
