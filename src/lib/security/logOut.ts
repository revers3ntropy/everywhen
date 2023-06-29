import { goto } from '$app/navigation';
import { LS_KEY } from '$lib/constants';
import { api } from '$lib/utils/apiRequest';

export async function logOut() {
    for (const key in LS_KEY) {
        localStorage.removeItem(LS_KEY[key as keyof typeof LS_KEY]);
    }

    await api.delete(null, '/auth');

    await goto('/');
}
