import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from '../helpers.js';

test.describe('/events', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/events', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/?redirect=events');
    });

    test('Can view page', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        const { api } = await generateUserAndSignIn(page);
        await page.goto('/events', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/events');
        await expectDeleteUser(api, expect);
    });
});
