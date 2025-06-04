import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from './lib/helpers';

test.describe('/journal/deleted', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/journal/deleted', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/login?redirect=journal%2Fdeleted');
    });

    test('Can delete entry and it appears only in the bin', async ({ page }) => {
        const { api, auth } = await generateUserAndSignIn(page);
        const body = 'my deleted entry';
        const { id } = (await api.post('/entries', { body })).unwrap();

        await page.goto('/journal/deleted', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/journal/deleted');

        await page.getByLabel('journal').click();
        await page.locator(`[id="${id}"]`).getByLabel('Open options for entry').click();
        page.once('dialog', dialog => {
            void dialog.accept();
        });
        await page.getByRole('button', { name: 'Move Entry to Bin' }).click();

        await page.goto('/journal/deleted', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/journal/deleted');
        await expect(page.getByText('my deleted entry')).toBeAttached();

        await expectDeleteUser(api, auth);
    });
});
