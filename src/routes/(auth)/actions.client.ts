import { displayNotifOnErr } from '$lib/components/notifications/notifications';
import type { Auth } from '$lib/controllers/user/user';
import { populateCookieWritablesWithCookies } from '$lib/stores';
import { api } from '$lib/utils/apiRequest';
import Cookie from 'js-cookie';

export async function populateCookiesAndSettingsAfterAuth(
    auth: Auth,
    onErr: () => void
): Promise<void> {
    const cookies = Cookie.get() as RawCookies;
    const { settings } = displayNotifOnErr(await api.get(auth, '/settings'), onErr);
    populateCookieWritablesWithCookies(cookies, settings);
}
