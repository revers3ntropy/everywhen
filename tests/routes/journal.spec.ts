import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from '../helpers.js';

test.describe('/journal', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/journal', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/?redirect=journal');
    });

    test('Can create and view entry', async ({ page }) => {
        const { api } = await generateUserAndSignIn(page);
        await page.goto('/journal', { waitUntil: 'networkidle' });

        const entryBody = 'This is a test entry body!';
        const entryTitle = 'This is a test entry title!';

        await page.waitForTimeout(1000);

        await page.getByLabel('Entry Title').click();
        await page.getByLabel('Entry Title').fill(entryTitle);
        await page.getByLabel('Entry Body').fill(entryBody);
        await page.getByRole('button', { name: 'Submit Entry' }).click();

        await expect(page.getByText(entryBody)).toBeAttached();
        // mobile title, entry title, and title in list of titles
        expect(await page.getByText(entryTitle).all()).toHaveLength(3);

        await expectDeleteUser(api, expect);
    });

    test('Can create entry with newly created label', async ({ page }) => {
        const { api } = await generateUserAndSignIn(page);
        await page.goto('/journal', { waitUntil: 'networkidle' });

        const labelName = 'Testing Label!';
        const entryBody =
            'The very long body of the entry which is too long' +
            ' to fit on one line in the titles sidebar!';

        await page.getByRole('button', { name: 'Set label' }).click();
        await page.getByRole('button', { name: 'Create new label' }).click();
        await page.getByLabel('Name').fill(labelName);
        await page.getByRole('button', { name: 'Create' }).click();
        await page.getByRole('textbox', { name: 'Entry Body' }).fill(entryBody);
        await page.getByRole('button', { name: 'Submit Entry' }).click();

        await expect(
            page
                .getByRole('link', {})
                .filter({ has: page.getByText(labelName) })
        ).toBeAttached();
        await expect(page.getByText(entryBody)).toBeAttached();

        await expectDeleteUser(api, expect);
    });
});
