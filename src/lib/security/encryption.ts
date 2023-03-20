import { browser } from '$app/environment';
import { PUBLIC_INIT_VECTOR } from '$env/static/public';
import * as crypto from 'crypto';
import { Result } from '../utils/result';

const ALGORITHM = 'aes-256-cbc';

export function encrypt (plainText: string, key: string): Result<string> {
    if (browser) {
        console.trace();
        throw 'Cannot encrypt/decrypt in browser';
    }
    if (!plainText) return Result.ok('');

    let encryptedData = '';

    try {
        const cipher = crypto.createCipheriv(ALGORITHM, key, PUBLIC_INIT_VECTOR);

        encryptedData = cipher.update(plainText, 'utf-8', 'hex');
        encryptedData += cipher.final('hex');
    } catch (e) {
        console.error(
            'Error encrypting ', typeof plainText,
            'of length', plainText.length,
            'with key', key,
            ':', e,
        );
        return Result.err('Error encrypting');
    }
    return Result.ok(encryptedData);
}

export function decrypt (cypherText: string, key: string): Result<string> {
    if (browser) {
        console.trace();
        throw 'Cannot encrypt/decrypt in browser';
    }
    if (!cypherText) return Result.ok('');

    let decryptedData = '';

    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, key, PUBLIC_INIT_VECTOR);

        decryptedData = decipher.update(cypherText, 'hex', 'utf-8');
        decryptedData += decipher.final('utf8');
    } catch (e) {
        console.error(
            'Error decrypting ', typeof cypherText,
            'of length', cypherText.length,
            'with key', key,
            ':', e,
        );
        return Result.err('Error decrypting');
    }

    return Result.ok(decryptedData);
}


