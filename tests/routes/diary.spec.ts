import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from '../helpers.js';

test.describe('/journal', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/journal', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/');
    });

    test('Can create and view entry', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        const { api } = await generateUserAndSignIn(page);
        await page.goto('/journal', { waitUntil: 'networkidle' });

        const entryBody = 'This is a test entry body!';
        const entryTitle = 'This is a test entry title!';

        await page.waitForTimeout(1000);

        await page.getByPlaceholder('Title').click();
        await page.getByPlaceholder('Title').fill(entryTitle);
        await page.getByPlaceholder('Entry').fill(entryBody);
        await page.getByRole('button', { name: 'Submit Entry' }).click();

        await expect(await page.getByText(entryTitle)).toBeTruthy();
        await expect(await page.getByText(entryBody)).toBeTruthy();

        await expectDeleteUser(api, expect);
    });
});
