import crypto from 'crypto-js';
import { Result } from '../../src/lib/utils/result';

function iv() {
    const { PUBLIC_INIT_VECTOR } = process.env;
    if (!PUBLIC_INIT_VECTOR) throw new Error();
    return crypto.enc.Utf8.parse(PUBLIC_INIT_VECTOR);
}

export function encrypt(plaintext: string, key: string | null): string {
    if (!key) throw new Error();
    const encrypted = crypto.AES.encrypt(plaintext, crypto.enc.Utf8.parse(key), {
        iv: iv()
    });
    return crypto.enc.Hex.stringify(encrypted.ciphertext);
}

export function decrypt(ciphertext: string, key: string | null): Result<string> {
    if (!key) return Result.err('Failed to decrypt data');
    try {
        const decrypted = crypto.AES.decrypt(
            crypto.enc.Hex.parse(ciphertext).toString(crypto.enc.Base64),
            crypto.enc.Utf8.parse(key),
            {
                iv: iv()
            }
        );
        const plaintext = decrypted.toString(crypto.enc.Utf8);
        return Result.ok(plaintext);
    } catch (e) {
        console.error(e);
        return Result.err('Failed to decrypt data');
    }
}
