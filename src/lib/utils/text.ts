import crypto from 'crypto';
import DomPurify from 'dompurify';
import { marked } from 'marked';
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

/**
 * Split into 'words' as best as possible
 */
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

export function numberAsSignedStr (num: number): string {
    return num >= 0 ? `+${num}` : `${num}`;
}

export function round1DP (num: number): number {
    return Math.round(num * 10) / 10;
}

export function rawMdToHtml (md: string, obfuscated = false): string {
    return DomPurify.sanitize(
        marked(obfuscated ? obfuscate(md) : md),
        { USE_PROFILES: { html: true } },
    );
}