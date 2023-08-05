import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from './helpers.js';

test.describe('/journal/deleted', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/journal/deleted', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/login?redirect=journal%2Fdeleted');
    });

    test('Can view page', async ({ page }) => {
        const { api } = await generateUserAndSignIn(page);
        await page.goto('/journal/deleted', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/journal/deleted');
        await expectDeleteUser(api, expect);
    });
});
