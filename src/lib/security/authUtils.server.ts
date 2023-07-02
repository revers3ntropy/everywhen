import sha256 from 'sha256';
import crypto from 'crypto';

export function encryptionKeyFromPassword(pass: string): string {
    return sha256(pass).substring(0, 32);
}

export function cryptoRandomStr(length = 32): string {
    return crypto.randomBytes(length).toString('base64url');
}
