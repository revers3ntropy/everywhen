import { PUBLIC_INIT_VECTOR } from '$env/static/public';
import crypto from 'crypto-js';
import { Result } from './result';

const wordArrayIv = crypto.enc.Utf8.parse(PUBLIC_INIT_VECTOR);

export function encrypt(plaintext: string, key: string | null, emptyOnNoKey = false): string {
    if (!key) {
        if (emptyOnNoKey) return '';
        throw new Error('No key');
    }
    const encrypted = crypto.AES.encrypt(plaintext, crypto.enc.Utf8.parse(key), {
        iv: wordArrayIv
    });
    return crypto.enc.Hex.stringify(encrypted.ciphertext);
}

export function decrypt(ciphertext: string, key: string | null): Result<string> {
    if (key === null) return Result.err('Failed to decrypt data');
    if (ciphertext === '') return Result.ok(ciphertext);

    try {
        const decrypted = crypto.AES.decrypt(
            crypto.enc.Hex.parse(ciphertext).toString(crypto.enc.Base64),
            crypto.enc.Utf8.parse(key),
            { iv: wordArrayIv }
        );
        const plaintext = decrypted.toString(crypto.enc.Utf8);

        // hopefully better detect decryption errors with wrong keys
        // (this is not a perfect solution, but it's better than nothing)
        if (plaintext === '') {
            // if the plaintext is empty, we can't be sure if the decryption failed
            // or if the plaintext was empty to begin with
            const encryptedEmptyStr = encrypt('', key);
            // if the encrypted empty string is the same as the ciphertext,
            // then the plaintext was empty to begin with
            // otherwise, the decryption failed silently
            if (encryptedEmptyStr === ciphertext) {
                return Result.ok(plaintext);
            }
            console.trace('Failed to decrypt data');
            return Result.err('Failed to decrypt data');
        }
        return Result.ok(plaintext);
    } catch (error) {
        console.trace('Failed to decrypt data');
        return Result.err('Failed to decrypt data');
    }
}

if (typeof window === 'object') {
    (window as unknown as Record<string, unknown>)['__encrypt'] = encrypt;
    (window as unknown as Record<string, unknown>)['__decrypt'] = decrypt;
}
