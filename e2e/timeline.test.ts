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
        await page.getByLabel('Event Name').fill('xyz');
        await Promise.all([
            page.waitForResponse(resp => resp.url().includes('/api/events')),
            await page.getByLabel('Create Event').click()
        ]);

        const events = await api.get('/events');
        expect(events.ok).toBeTruthy();
        if (!events.ok) return;
        expect(events.val.events.length).toBe(1);
        expect(events.val.events[0].name).toBe('xyz');

        await expectDeleteUser(api, auth);
    });
});
