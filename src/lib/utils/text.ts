import crypto from 'crypto';
import { OBFUSCATE_CHARS } from '../constants';

export function obfuscate (
    str: string,
    alphabet = OBFUSCATE_CHARS,
): string {
    return str.replace(/./g, (char) => {
        if (char === '\n') {
            return char;
        }
        return alphabet[Math.floor(Math.random() * alphabet.length)];
    });
}

export function splitText (text: string): string[] {
    return text.split(/[\s,.\-:;!"*()=+\[\]{}?|]+/)
               .filter(Boolean);
}

export function wordCount (text: string): number {
    return splitText(text).length;
}

export function cryptoRandomStr (length = 32): string {
    return crypto
        .randomBytes(length)
        .toString('base64url');
}