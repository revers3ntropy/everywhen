import { expect, test } from '@playwright/test';
import { UUID_LEN } from '../src/lib/constants';
import { expectDeleteUser, expectTrue, generateUserAndSignIn } from './lib/helpers';

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
        const { api, auth } = await generateUserAndSignIn(page);
        await page.goto('/journal', { waitUntil: 'networkidle' });

        const entryBody = 'This is a test entry body!';
        const entryTitle = 'This is a test entry title!';

        await page.getByLabel('Entry Title').click();
        await page.getByLabel('Entry Title').fill(entryTitle);
        await page.getByLabel('Entry Body').fill(entryBody);
        await page.getByRole('button', { name: 'Submit Entry' }).click();

        await expect(page.getByText(entryBody)).toBeAttached();
        // mobile title and entry title
        expect(await page.getByText(entryTitle).all()).toHaveLength(2);

        await page.reload({ waitUntil: 'networkidle' });

        // sidebar should have appeared now so +1 occurrences
        expect(await page.getByText(entryTitle).all()).toHaveLength(3);

        await expectDeleteUser(api, auth);
    });

    test('Can create entry with newly created label', async ({ page }) => {
        const { api, auth } = await generateUserAndSignIn(page);
        await page.goto('/journal', { waitUntil: 'networkidle' });

        const labelName = 'Testing Label!';

        await page.getByRole('button', { name: 'Set label' }).click({ force: true });
        await page.getByRole('button', { name: 'Create new label' }).click();
        await page.getByLabel('Name').fill(labelName);
        await page.getByText('Create', { exact: true }).click();
        await page.getByRole('textbox', { name: 'Entry Body' }).fill(LONG_TEXT);
        await page.getByRole('button', { name: 'Submit Entry' }).click();

        await expect(
            page.getByRole('link').filter({ has: page.getByText(labelName) })
        ).toBeAttached();
        await expect(page.getByText(LONG_TEXT)).toBeAttached();

        await expectDeleteUser(api, auth);
    });

    test('Can add to and remove from favourites', async ({ page }) => {
        const { api } = await generateUserAndSignIn(page);

        const entryBody = LONG_TEXT;
        const makeEntryRes = await api.post('/entries', { body: entryBody });
        expectTrue(makeEntryRes.ok);
        const { id } = makeEntryRes.val;
        expect(typeof id === 'string').toBe(true);
        if (typeof id !== 'string') throw id;
        expect(id).toHaveLength(UUID_LEN);

        await page.goto('/journal');
        await expect(page.getByText(entryBody)).toBeAttached();

        // can pin entry
        await page.locator(`[id="${id}"]`).getByRole('button', { name: 'Open popup' }).click();
        await page.getByRole('button', { name: 'Add to Favourites' }).click();

        // can then unpin without reloading page
        await page.locator(`[id="${id}"]`).getByRole('button', { name: 'Open popup' }).click();
        await page.getByRole('button', { name: 'Remove from Favourites' }).click();

        await page.reload();

        // can pin entry
        await page.locator(`[id="${id}"]`).getByRole('button', { name: 'Open popup' }).click();
        await page.getByRole('button', { name: 'Add to Favourites' }).click();

        await page.reload();

        // can then unpin after reloading page
        await page.locator(`[id="${id}"]`).getByRole('button', { name: 'Open popup' }).click();
        await page.getByRole('button', { name: 'Remove from Favourites' }).click();
    });
});
