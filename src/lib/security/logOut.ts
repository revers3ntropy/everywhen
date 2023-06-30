import { goto } from '$app/navigation';
import { STORE_KEY } from '$lib/constants';
import { api } from '$lib/utils/apiRequest';

export async function logOut(wantsToStay = false) {
    for (const key in STORE_KEY) {
        localStorage.removeItem(STORE_KEY[key as keyof typeof STORE_KEY]);
    }

    await api.delete(null, '/auth');

    if (wantsToStay) {
        const returnPath = encodeURIComponent(location.pathname.substring(1) + location.search);
        await goto(`/login?redirect=${returnPath}`);
    } else {
        await goto('/');
    }
}
