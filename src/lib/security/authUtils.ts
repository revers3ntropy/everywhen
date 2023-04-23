import { sha256 } from 'js-sha256';

export function encryptionKeyFromPassword (pass: string): string {
    return sha256(pass).substring(0, 32);
}