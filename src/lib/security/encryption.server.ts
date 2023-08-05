import { PUBLIC_INIT_VECTOR } from '$env/static/public';
import * as crypto from 'crypto';
import { errorLogger } from '../utils/log.server';
import { Result } from '../utils/result';

const ALGORITHM = 'aes-256-cbc';

export function encrypt(plainText: string, key: string): string {
    if (plainText.length < 1) return '';
    if (key.length !== 32) throw new Error('Invalid key length');

    const cipher = crypto.createCipheriv(ALGORITHM, key, PUBLIC_INIT_VECTOR);
    return cipher.update(plainText, 'utf-8', 'hex') + cipher.final('hex');
}

export function decrypt(cypherText: string, key: string | null): Result<string> {
    if (cypherText.length < 1) return Result.ok('');
    if (!key) return Result.err('No encryption key found');
    if (key.length !== 32) return Result.err('Invalid key length');

    let decryptedData = '';

    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, key, PUBLIC_INIT_VECTOR);

        decryptedData = decipher.update(cypherText, 'hex', 'utf-8');
        decryptedData += decipher.final('utf8');
    } catch (e) {
        void errorLogger.log(
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
