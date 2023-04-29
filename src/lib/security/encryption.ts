import { browser } from '$app/environment';
import { PUBLIC_INIT_VECTOR } from '$env/static/public';
import * as crypto from 'crypto';
import { AES, enc } from 'crypto-js';
import { errorLogger } from '../utils/log';
import { Result } from '../utils/result';

const ALGORITHM = 'aes-256-cbc';

function browserEncrypt(plaintext: string, key: string): Result<string> {
    const encrypted = AES.encrypt(plaintext, enc.Utf8.parse(key), {
        iv: enc.Utf8.parse(PUBLIC_INIT_VECTOR)
    });
    if (!encrypted) {
        return Result.err('Error encrypting');
    }
    return Result.ok(enc.Hex.stringify(encrypted.ciphertext));
}

export function encrypt(plainText: string, key: string): Result<string> {
    if (plainText.length < 1) return Result.ok('');

    if (browser) {
        return browserEncrypt(plainText, key);
    }

    let encryptedData = '';

    try {
        const cipher = crypto.createCipheriv(
            ALGORITHM,
            key,
            PUBLIC_INIT_VECTOR
        );

        encryptedData = cipher.update(plainText, 'utf-8', 'hex');
        encryptedData += cipher.final('hex');
    } catch (e) {
        void errorLogger.logToFile(
            `Error encrypting ${typeof plainText} of length ${
                plainText.length
            } with key len ${key.length}:`,
            e
        );
        return Result.err('Error encrypting');
    }
    return Result.ok(encryptedData);
}

export function decrypt(cypherText: string, key: string): Result<string> {
    if (cypherText.length < 1) return Result.ok('');

    if (browser) {
        return Result.err('Cannot decrypt in browser');
    }

    let decryptedData = '';

    try {
        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            key,
            PUBLIC_INIT_VECTOR
        );

        decryptedData = decipher.update(cypherText, 'hex', 'utf-8');
        decryptedData += decipher.final('utf8');
    } catch (e) {
        void errorLogger.logToFile(
            'Error decrypting ',
            typeof cypherText,
            'of length',
            cypherText.length,
            'with key len ',
            key.length,
            ':',
            e
        );
        return Result.err('Error decrypting');
    }

    return Result.ok(decryptedData);
}

export function encryptMulti<T extends string[]>(
    key: string,
    ...plainTexts: T
): Result<T> {
    return Result.collect(
        plainTexts.map(text => encrypt(text, key))
    ) as Result<T>;
}
