import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from '../helpers.js';

test.describe('/stats', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/stats', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/');
    });

    test('Can view page', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        const { api } = await generateUserAndSignIn(page);
        await page.goto('/stats', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/stats');
        await expect(await page.getByText('No Entries')).toBeTruthy();
        await expectDeleteUser(api, expect);
    });
});
