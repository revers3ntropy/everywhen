import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from '../helpers.js';

test.describe('/stats', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/stats', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/?redirect=stats');
    });

    test('Can view page', async ({ page }) => {
        const { api } = await generateUserAndSignIn(page);
        await page.goto('/stats', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/stats');
        expect(page.getByText('No Entries')).toBeTruthy();
        await expectDeleteUser(api, expect);
    });
});
