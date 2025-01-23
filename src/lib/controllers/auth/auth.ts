import { browser } from '$app/environment';
import { notify } from '$lib/components/notifications/notifications';
import {
    COOKIES_TO_CLEAR_ON_LOGOUT,
    LS_TO_CLEAR_ON_LOGOUT,
    SESSION_KEYS,
    SESSION_TO_CLEAR_ON_LOGOUT
} from '$lib/constants';
import type { SubscriptionType } from '$lib/controllers/subscription/subscription';
import { currentlyUploadingAssets, populateCookieWritablesWithCookies } from '$lib/stores';
import { decrypt } from '$lib/utils/encryption';
import { Logger } from '$lib/utils/log';
import Cookie from 'js-cookie';
import { api } from '$lib/utils/apiRequest';
import { goto } from '$app/navigation';
import { sha256 } from 'js-sha256';

const logger = new Logger('AuthC');

export interface Auth {
    id: string;
    username: string;
    key: string;
    activeSubscriptions: SubscriptionType[];
}

export namespace Auth {
    function removeFromStorageAndEmitEvent(storage: Storage, key: string) {
        const oldValue = storage.getItem(key);
        storage.removeItem(key);
        window.dispatchEvent(
            new StorageEvent('storage', {
                key,
                oldValue,
                newValue: null,
                storageArea: storage
            })
        );
    }

    export function wantsToStayLoggedInAuthUrl(currentUrl: string): string {
        const url = new URL(currentUrl);
        const returnPath = encodeURIComponent(url.pathname.substring(1) + url.search);
        if (returnPath.startsWith('login')) return '/login';
        return `/login?redirect=${returnPath}`;
    }

    export async function logOut(wantsToStay = false) {
        if (!browser) return;

        for (const key of LS_TO_CLEAR_ON_LOGOUT) {
            removeFromStorageAndEmitEvent(localStorage, key);
        }
        for (const key of SESSION_TO_CLEAR_ON_LOGOUT) {
            removeFromStorageAndEmitEvent(sessionStorage, key);
        }
        for (const key of COOKIES_TO_CLEAR_ON_LOGOUT) {
            Cookie.remove(key);
        }

        await api.delete(
            '/auth',
            {},
            { doNotEncryptBody: true, doNotTryToDecryptResponse: true, doNotLogoutOn401: true }
        );

        currentlyUploadingAssets.set(0);

        // do not trigger storage event for these
        localStorage.removeItem(SESSION_KEYS.username);
        localStorage.removeItem(SESSION_KEYS.encryptionKey);

        if (wantsToStay) {
            await goto(wantsToStayLoggedInAuthUrl(location.href));
        } else {
            await goto('/');
        }
    }

    export function decryptOrLogOut(ciphertext: string, key: string | null): string {
        const decryptRes = decrypt(ciphertext, key);
        if (!decryptRes.ok) {
            logger.error('Could not decrypt', { decryptRes });
            void logOut();
            notify.error('Something went wrong. Please log in again.');
            throw new Error('Could not decrypt');
        }
        return decryptRes.val;
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

    export async function populateCookiesAndSettingsAfterAuth(onErr: () => void): Promise<void> {
        const cookies = Cookie.get() as RawCookies;
        const { settings } = notify.onErr(await api.get('/settings'), onErr);
        populateCookieWritablesWithCookies(cookies, settings);
    }
}
