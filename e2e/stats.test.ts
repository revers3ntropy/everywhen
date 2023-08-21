import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from './helpers';

test.describe('/stats', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/stats', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/login?redirect=stats');
    });

    test('Can view page', async ({ page }) => {
        const { api, auth } = await generateUserAndSignIn(page);
        await page.goto('/stats', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/stats');
        await expect(page.getByText('No Entries')).toBeAttached();
        await expectDeleteUser(api, auth);
    });
});
