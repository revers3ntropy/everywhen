import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from '../helpers.js';

test.describe('/journal/deleted', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/journal/deleted', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/');
    });

    test('Can view page', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        const { api } = await generateUserAndSignIn(page);
        await page.goto('/journal/deleted', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/deleted');
        await expectDeleteUser(api, expect);
    });
});
