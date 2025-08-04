import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { notify } from '$lib/components/notifications/notifications';
import { ENCRYPTED_TEXT_PREFIX, NON_ENCRYPTED_TEXT_PREFIX } from '$lib/constants';
import { encryptionKey } from '$lib/stores';
import { decrypt, encrypt } from '$lib/utils/encryption';

export function tryDecryptText(text: string): string {
    if (!browser || !get(encryptionKey)) return '';
    if (text.startsWith(ENCRYPTED_TEXT_PREFIX))
        return notify.onErr(decrypt(text.slice(ENCRYPTED_TEXT_PREFIX.length), get(encryptionKey)));
    if (text.startsWith(NON_ENCRYPTED_TEXT_PREFIX))
        return text.slice(NON_ENCRYPTED_TEXT_PREFIX.length);
    throw 'invalid text';
}

export function tryEncryptText(text: string): string {
    // TODO if user does not want e2e encryption, return text with NON_ENCRYPTED_TEXT_PREFIX
    if (!browser) throw 'not browser';
    if (!get(encryptionKey)) throw 'no encryption key';
    return `${ENCRYPTED_TEXT_PREFIX}${encrypt(text, get(encryptionKey))}`;
}
