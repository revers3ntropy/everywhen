import { expect, test } from '@playwright/test';
import { expectDeleteUser, generateUserAndSignIn } from './lib/helpers';

test.describe('Datasets', () => {
    test('Cannot visit page without authentication', async ({ page }) => {
        await page.goto('/datasets', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/login?redirect=datasets');
    });

    test('Create empty dataset, add column, add rows, modify data', async ({ page }) => {
        const { api, auth } = await generateUserAndSignIn(page);
        // create and go to dataset
        await page.goto('/datasets');
        await page.getByLabel('Open popup to create dataset').click();
        await Promise.all([
            page.waitForResponse(
                resp =>
                    resp.url().includes('/api/datasets') &&
                    resp.status() === 200 &&
                    resp.request().method() === 'POST'
            ),
            await page.getByRole('button', { name: 'Blank' }).click()
        ]);
        await page.reload();
        await expect(page.getByLabel(`View dataset 'Blank'`)).toBeAttached();
        await page.getByLabel(`View dataset 'Blank'`).click();

        await expect(page.getByLabel('Dataset name')).toHaveValue('Blank');

        // new column
        await Promise.all([
            page.waitForResponse(
                resp =>
                    resp.url().includes('/api/datasets') &&
                    resp.status() === 200 &&
                    resp.request().method() === 'POST'
            ),
            page.getByRole('button', { name: '+', exact: true }).click()
        ]);
        await page.reload();
        await expect(page.getByLabel('Dataset name')).toHaveValue('Blank');

        // create row
        await Promise.all([
            page.waitForResponse(
                resp =>
                    resp.url().includes('/api/datasets') &&
                    resp.status() === 200 &&
                    resp.request().method() === 'POST'
            ),
            page.getByRole('button', { name: '+ Add Row' }).click()
        ]);
        await page.reload();

        // edit row
        const datapoint = page.getByLabel(`row-1-col-New Column`);
        await expect(datapoint).toBeAttached();
        await datapoint.click();
        await datapoint.fill('1');
        // click away to trigger 'onchange'
        await Promise.all([
            page.waitForResponse(
                resp =>
                    resp.url().includes('/api/datasets') &&
                    resp.status() === 200 &&
                    resp.request().method() === 'POST'
            ),
            page.getByRole('button', { name: '+ Add Row' }).click()
        ]);
        await page.reload();

        await expect(page.getByLabel(`row-1-col-New Column`)).toHaveValue('1');
        await expect(page.getByLabel(`row-2-col-New Column`)).toHaveValue('0');

        // clean up
        await page.getByRole('button', { name: 'Delete' }).click();

        await expectDeleteUser(api, auth);
    });
});
