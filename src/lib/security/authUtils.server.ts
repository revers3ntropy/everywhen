import sha256 from 'sha256';

export function encryptionKeyFromPassword(pass: string): string {
    return sha256(pass).substring(0, 32);
}
