import { expect, test } from '@playwright/test';
import { USERNAME_COOKIE_KEY } from '../../src/lib/constants.js';
import { encryptionKeyFromPassword } from '../../src/lib/security/authUtils.js';
import {
    deleteUser,
    expectDeleteUser,
    generateApiCtx,
    generateUser,
    randStr,
} from '../helpers.js';

test.describe('/', () => {
    test('Has title', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });

        await expect(page).toHaveTitle(/Diary/);
    });

    test('Can create account with form', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });

        const auth = {
            username: randStr(),
            password: randStr(),
        };

        expect(await page.isVisible('input[aria-label="Password"]'))
            .toBe(true);
        expect(await page.isVisible('input[aria-label="Username"]'))
            .toBe(true);
        expect(await page.isVisible('button[aria-label="Create Account"]'))
            .toBe(true);
        expect(await page.isVisible('button[aria-label="Log In"]'))
            .toBe(true);

        await page.getByLabel('Username').fill(auth.username);
        await page.getByLabel('Password').fill(auth.password);

        await page.getByRole('button', { name: 'Log In' }).click();

        // haven't been signed in with random credentials
        await expect(page).toHaveURL('/');

        await page.goto('/home', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/');

        // inputs are erased when checking that we can't go to /home
        // focus page before typing ??? TODO why that is dumb
        await page.getByLabel('Username').click();
        await page.getByLabel('Username').type(auth.username);
        await page.getByLabel('Password').fill(auth.password);
        await page.getByRole('button', { name: 'Create Account' })
                  .click();

        await page.waitForURL('/home');

        const usernameCookieIdx = (await page.context().cookies())
            .findIndex(c => c.name === USERNAME_COOKIE_KEY);
        expect(usernameCookieIdx).toBeGreaterThan(-1);

        await expect(page).toHaveURL('/home');

        expect(await page.isVisible('button[aria-label="Delete Account"]'))
            .toBe(true);

        const api = await generateApiCtx({
            username: auth.username,
            key: encryptionKeyFromPassword(auth.password),
        });

        await expectDeleteUser(api, expect);

        await page.waitForLoadState();
        await page.goto('/', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/');

        await page.getByLabel('Username').fill(auth.username);
        await page.getByLabel('Password').fill(auth.password);

        await page.getByRole('button', { name: 'Log In' }).click();

        // account doesn't exist and wil be redirected if try to log in
        await page.goto('/home', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/');
    });

    test('Can log into account', async ({ page }) => {
        const { auth, api } = await generateUser();
        await page.goto('/', { waitUntil: 'networkidle' });

        await page.getByLabel('Username').fill(auth.username);
        await page.getByLabel('Password').fill(auth.password);

        await page.getByRole('button', { name: 'Log In' }).click();

        await page.waitForURL('/home', { waitUntil: 'networkidle' });

        const { err } = await deleteUser(api);
        expect(err).toBe(null);

        await page.goto('/home', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/');
    });
});

