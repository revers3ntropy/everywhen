import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from './lib/helpers';

test.describe('/events', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/events', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/login?redirect=events');
    });

    test('Can view page', async ({ page }) => {
        const { api, auth } = await generateUserAndSignIn(page);
        await page.goto('/events', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/events');
        await expectDeleteUser(api, auth);
    });
});
