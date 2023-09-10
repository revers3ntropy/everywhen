import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from './lib/helpers';

test.describe('Datasets', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/datasets', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/login?redirect=datasets');
    });

    test('Can record weight', async ({ page }) => {
        const { api, auth } = await generateUserAndSignIn(page);
        await page.goto('/datasets', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/datasets');

        await page.getByRole('button', { name: "Start Recording 'Weight'" }).click();
        await page.goto('/journal', { waitUntil: 'networkidle' });

        await page.getByLabel('enter your weight').fill('10');
        await page.getByLabel('Submit Weight').click();
        await expect(page.getByText('Weight entered')).toBeAttached();

        await page.getByLabel('Submit Weight').click();
        await expect(page.getByText('Invalid weight')).toBeAttached();

        await expectDeleteUser(api, auth);
    });
});
