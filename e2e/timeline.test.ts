import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from './lib/helpers';

test.describe('/timeline', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/timeline', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/login?redirect=timeline');
    });

    test('Can view page', async ({ page }) => {
        const { api, auth } = await generateUserAndSignIn(page);
        await page.goto('/timeline', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/timeline');
        await expectDeleteUser(api, auth);
    });

    test('Can create event from button', async ({ page }) => {
        const { api, auth } = await generateUserAndSignIn(page);
        await page.goto('/timeline', { waitUntil: 'networkidle' });

        await page.getByRole('button', { name: 'New Event' }).click();
        await page.getByPlaceholder('Event Name').fill('xyz');
        await page.getByPlaceholder('End').press('Escape');
        await page.goto('/events', { waitUntil: 'networkidle' });
        expect(await page.getByRole('listitem').getByPlaceholder('Event Name').inputValue()).toBe(
            'xyz'
        );

        await expectDeleteUser(api, auth);
    });
});
