import { browser } from '$app/environment';
import {
    COOKIES_TO_CLEAR_ON_LOGOUT,
    LS_TO_CLEAR_ON_LOGOUT,
    SESSION_KEYS,
    SESSION_TO_CLEAR_ON_LOGOUT
} from '$lib/constants';
import { currentlyUploadingAssets, currentlyUploadingEntries } from '$lib/stores';
import { decrypt } from '$lib/utils/encryption';
import Cookie from 'js-cookie';
import { api } from '$lib/utils/apiRequest';
import { goto } from '$app/navigation';
import { sha256 } from 'js-sha256';

export interface Auth {
    id: string;
    username: string;
    key: string;
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

    export function requireAuthUrl(currentUrl: string): string {
        const url = new URL(currentUrl);
        const returnPath = encodeURIComponent(url.pathname.substring(1) + url.search);
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
        currentlyUploadingEntries.set(0);

        // do not trigger storage event for these
        sessionStorage.removeItem(SESSION_KEYS.username);
        sessionStorage.removeItem(SESSION_KEYS.encryptionKey);

        if (wantsToStay) {
            await goto(requireAuthUrl(location.href));
        } else {
            await goto('/');
        }
    }

    export function decryptOrLogOut(ciphertext: string, key: string | null): string {
        const { err, val } = decrypt(ciphertext, key);
        if (err) {
            void logOut();
            console.error(err);
            throw new Error('Could not decrypt');
        }
        return val;
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
