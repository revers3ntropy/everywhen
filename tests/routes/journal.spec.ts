import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from '../helpers.js';

const LONG_TEXT =
    'The very long body of the entry which is too long' +
    ' to fit on one line in the titles sidebar and therefore' +
    ' will only appear once in the page.';

test.describe('/journal', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/journal', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/login?redirect=journal');
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

        await page.getByRole('button', { name: 'Set label' }).click({ force: true });
        await page.getByRole('button', { name: 'Create new label' }).click();
        await page.getByLabel('Name').fill(labelName);
        await page.getByRole('button', { name: 'Create' }).click();
        await page.getByRole('textbox', { name: 'Entry Body' }).fill(LONG_TEXT);
        await page.getByRole('button', { name: 'Submit Entry' }).click();

        await expect(
            page.getByRole('link').filter({ has: page.getByText(labelName) })
        ).toBeAttached();
        await expect(page.getByText(LONG_TEXT)).toBeAttached();

        await expectDeleteUser(api, expect);
    });

    test('Can mark entry as favourite and unfavourite', async ({ page }) => {
        const { api } = await generateUserAndSignIn(page);

        const entry = LONG_TEXT;
        const makeEntryRes = await api.post('./entries', {
            data: { entry }
        });
        await page.goto('/journal');

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { id } = await makeEntryRes.json();
        expect(typeof id === 'string').toBe(true);
        if (typeof id !== 'string') throw id;
        expect(id).toHaveLength(36);

        await expect(page.getByText(entry)).toBeAttached();

        // can pin entry
        await page.locator(`[id="${id}"]`).getByRole('button', { name: 'Open popup' }).click();
        await page.getByRole('button', { name: 'Pin Entry' }).click();

        // can then unpin without reloading page
        await page.locator(`[id="${id}"]`).getByRole('button', { name: 'Open popup' }).click();
        await page.getByRole('button', { name: 'Unpin Entry' }).click();

        await page.reload();

        // can pin entry
        await page.locator(`[id="${id}"]`).getByRole('button', { name: 'Open popup' }).click();
        await page.getByRole('button', { name: 'Pin Entry' }).click();

        await page.reload();

        // can then unpin after reloading page
        await page.locator(`[id="${id}"]`).getByRole('button', { name: 'Open popup' }).click();
        await page.getByRole('button', { name: 'Unpin Entry' }).click();
    });
});
