import { goto } from '$app/navigation';
import { COOKIES_TO_CLEAR_ON_LOGOUT, LS_TO_CLEAR_ON_LOGOUT } from '$lib/constants';
import { api } from '$lib/utils/apiRequest';
import Cookie from 'js-cookie';

export async function logOut(wantsToStay = false) {
    for (const key of LS_TO_CLEAR_ON_LOGOUT) {
        localStorage.removeItem(key);
    }

    for (const key of COOKIES_TO_CLEAR_ON_LOGOUT) {
        Cookie.remove(key);
    }

    await api.delete(null, '/auth');

    if (wantsToStay) {
        const returnPath = encodeURIComponent(location.pathname.substring(1) + location.search);
        await goto(`/login?redirect=${returnPath}`);
    } else {
        await goto('/');
    }
}
