import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from '../helpers.js';

test.describe('/assets', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/assets', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/?redirect=assets');
    });

    test('Can view page', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        const { api } = await generateUserAndSignIn(page);
        await page.goto('/assets', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/assets');
        await expectDeleteUser(api, expect);
    });
});
