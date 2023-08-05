import { PUBLIC_INIT_VECTOR } from '$env/static/public';
import crypto from 'crypto-js';
import { notify } from '$lib/components/notifications/notifications';
import { clientLogger } from '$lib/utils/log';
import { Result } from '$lib/utils/result';

export function encrypt(plaintext: string, key: string | null): string {
    if (!key) {
        notify.error('Failed to encrypt data');
        clientLogger.error(key);
        throw new Error();
    }
    try {
        const encrypted = crypto.AES.encrypt(plaintext, crypto.enc.Utf8.parse(key), {
            iv: crypto.enc.Utf8.parse(PUBLIC_INIT_VECTOR)
        });
        return crypto.enc.Hex.stringify(encrypted.ciphertext);
    } catch (e) {
        notify.error('Failed to encrypt data');
        clientLogger.error(e);
        throw new Error();
    }
}

export function decrypt(ciphertext: string, key: string | null): Result<string> {
    if (!key) {
        return Result.err('Failed to decrypt data');
    }
    try {
        const decrypted = crypto.AES.decrypt(
            crypto.enc.Hex.parse(ciphertext).toString(crypto.enc.Base64),
            crypto.enc.Utf8.parse(key),
            {
                iv: crypto.enc.Utf8.parse(PUBLIC_INIT_VECTOR)
            }
        );
        const plaintext = decrypted.toString(crypto.enc.Utf8);
        return Result.ok(plaintext);
    } catch (e) {
        notify.error('Failed to decrypt data');
        clientLogger.log({ ciphertext, key, keyLen: key.length });
        clientLogger.error(e);
        return Result.err('Failed to decrypt data');
    }
}
