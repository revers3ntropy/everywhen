import { expect, test } from '@playwright/test';
import { COOKIE_KEYS } from '../src/lib/constants';
import { ApiClient } from './lib/apiClient';
import { encryptionKeyFromPassword, expectDeleteUser, generateUser, randStr } from './lib/helpers';

test.describe('/signup', () => {
    test('Has title', async ({ page }) => {
        await page.goto('/signup', { waitUntil: 'networkidle' });
        await expect(page).toHaveTitle(/Sign Up/);
    });

    test('Can create account with form', async ({ page }) => {
        await page.goto('/login');

        const auth = {
            username: randStr(),
            password: randStr()
        };

        await expect(page.getByLabel('Password')).toBeAttached();
        expect(await page.isVisible('input[aria-label="Password"]')).toBe(true);
        expect(await page.isVisible('input[aria-label="Username"]')).toBe(true);
        expect(await page.isVisible('a[aria-label="Create Account"]')).toBe(true);
        expect(await page.isVisible('button[aria-label="Log In"]')).toBe(true);

        await page.getByLabel('Username').fill(auth.username);
        await page.getByLabel('Password').fill(auth.password);

        await page.getByRole('button', { name: 'Log In' }).click();

        // haven't been signed in with random credentials
        await expect(page).toHaveURL('/login');

        await page.goto('/journal');
        await expect(page).toHaveURL('/login?redirect=journal');
        await page.goto('/login');
        await expect(page).toHaveURL('/login');

        await page.goto('/signup');
        await expect(page).toHaveURL('/signup');

        // inputs are erased when checking that we can't go to /journal
        // focus page before typing ??? TODO why, that is weird
        await page.getByLabel('Username').click();
        await page.getByLabel('Username').type(auth.username);
        await page.getByLabel('Password').fill(auth.password);
        await page.getByRole('button', { name: 'Create Account' }).click();

        await page.waitForURL('/journal');

        const sessionCookieIdx = (await page.context().cookies()).findIndex(
            c => c.name === COOKIE_KEYS.sessionId
        );
        expect(sessionCookieIdx).toBeGreaterThan(-1);

        await expect(page).toHaveURL('/journal');

        await page.goto('/settings');
        await expect(page).toHaveURL('/settings');

        await expect(page.getByLabel('Delete Account')).toBeAttached();
        expect(await page.isVisible('a[aria-label="Delete Account"]')).toBe(true);

        const api = await ApiClient.fromSessionId(
            (await page.context().cookies())[sessionCookieIdx].value,
            encryptionKeyFromPassword(auth.password)
        );

        await expectDeleteUser(api, {
            username: auth.username,
            key: encryptionKeyFromPassword(auth.password)
        });

        await page.goto('/login', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/login');

        await page.getByLabel('Username').fill(auth.username);
        await page.getByLabel('Password').fill(auth.password);

        await page.getByRole('button', { name: 'Log In' }).click();

        // account doesn't exist and wil be redirected if try to log in
        await page.goto('/journal', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/login?redirect=journal');
    });

    test('Can log into account', async ({ page }) => {
        const { auth, api } = await generateUser();
        await page.goto('/login', { waitUntil: 'networkidle' });

        await page.getByLabel('Username').fill(auth.username);
        await page.getByLabel('Password').fill(auth.password);

        await page.getByRole('button', { name: 'Log In' }).click();
        await page.waitForURL('/journal', { waitUntil: 'networkidle' });

        await expectDeleteUser(api, auth);

        await page.goto('/journal', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/login?redirect=journal');
    });
});
