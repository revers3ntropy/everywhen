import { browser } from '$app/environment';
import { notify } from '$lib/components/notifications/notifications';
import { ENCRYPTED_TEXT_PREFIX, NON_ENCRYPTED_TEXT_PREFIX } from '$lib/constants';
import { encryptionKey } from '$lib/stores';
import { decrypt } from '$lib/utils/encryption';
import { get } from 'svelte/store';

export function tryDecryptText(text: string): string {
    if (!browser) return '';
    if (text.startsWith(ENCRYPTED_TEXT_PREFIX))
        return notify.onErr(decrypt(text.slice(ENCRYPTED_TEXT_PREFIX.length), get(encryptionKey)));
    if (text.startsWith(NON_ENCRYPTED_TEXT_PREFIX))
        return text.slice(NON_ENCRYPTED_TEXT_PREFIX.length);
    throw 'invalid text';
}
