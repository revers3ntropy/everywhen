import { notify } from '$lib/components/notifications/notifications';
import { populateCookieWritablesWithCookies } from '$lib/stores';
import { api } from '$lib/utils/apiRequest';
import Cookie from 'js-cookie';

export async function populateCookiesAndSettingsAfterAuth(onErr: () => void): Promise<void> {
    const cookies = Cookie.get() as RawCookies;
    const { settings } = notify.onErr(await api.get('/settings'), onErr);
    populateCookieWritablesWithCookies(cookies, settings);
}
