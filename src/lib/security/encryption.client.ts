import { PUBLIC_INIT_VECTOR } from '$env/static/public';
import crypto from 'crypto-js';
import { Result } from '../utils/result';

export function encrypt(plaintext: string, key: string): Result<string> {
    const encrypted = crypto.AES.encrypt(plaintext, crypto.enc.Utf8.parse(key), {
        iv: crypto.enc.Utf8.parse(PUBLIC_INIT_VECTOR)
    });
    if (!encrypted) {
        return Result.err('Error encrypting');
    }
    return Result.ok(crypto.enc.Hex.stringify(encrypted.ciphertext));
}
