import { COOKIES_TO_CLEAR_ON_LOGOUT, LS_TO_CLEAR_ON_LOGOUT } from '$lib/constants';
import Cookie from 'js-cookie';
import { api } from '$lib/utils/apiRequest';
import { goto } from '$app/navigation';
import { sha256 } from 'js-sha256';

export interface Auth {
    id: string;
    username: string;
    key: string;
}

export type RawAuth = Omit<Auth, 'id'>;

export namespace Auth {
    export async function logOut(wantsToStay = false) {
        for (const key of LS_TO_CLEAR_ON_LOGOUT) {
            localStorage.removeItem(key);
        }

        for (const key of COOKIES_TO_CLEAR_ON_LOGOUT) {
            Cookie.remove(key);
        }

        await api.delete('/auth');

        if (wantsToStay) {
            const returnPath = encodeURIComponent(location.pathname.substring(1) + location.search);
            await goto(`/login?redirect=${returnPath}`);
        } else {
            await goto('/');
        }
    }

    export function encryptionKeyFromPassword(pass: string): string {
        return sha256(pass).substring(0, 32);
    }

    export function randomString(len: number): string {
        const arr = new Uint8Array(len);
        window.crypto.getRandomValues(arr);
        return Array.from(arr, dec => dec.toString(16)).join('');
    }

    export function randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
