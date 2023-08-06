import { PUBLIC_INIT_VECTOR } from '$env/static/public';
import crypto from 'crypto-js';
import { clientLogger } from './log';
import { Result } from './result';

export function encrypt(plaintext: string, key: string | null): string {
    if (!key) {
        clientLogger.error(key);
        throw new Error();
    }
    try {
        const encrypted = crypto.AES.encrypt(plaintext, crypto.enc.Utf8.parse(key), {
            iv: crypto.enc.Utf8.parse(PUBLIC_INIT_VECTOR)
        });
        return crypto.enc.Hex.stringify(encrypted.ciphertext);
    } catch (e) {
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
        clientLogger.log({ ciphertext, key, keyLen: key.length });
        clientLogger.error(e);
        return Result.err('Failed to decrypt data');
    }
}
