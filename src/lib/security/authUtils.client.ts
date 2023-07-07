import { sha256 } from 'js-sha256';

export function encryptionKeyFromPassword(pass: string): string {
    return sha256(pass).substring(0, 32);
}

export function randomString(len: number): string {
    const arr = new Uint8Array(len);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, dec => dec.toString(16)).join('');
}

export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
