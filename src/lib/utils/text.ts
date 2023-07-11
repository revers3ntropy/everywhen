import DomPurify from 'dompurify';
import { marked } from 'marked';
import { OBFUSCATE_CHARS } from '../constants';

export function obfuscate(str: string, alphabet = OBFUSCATE_CHARS): string {
    return str.replace(/./g, char => {
        if (char === '\n') {
            return char;
        }
        return alphabet[Math.floor(Math.random() * alphabet.length)];
    });
}
/**
 * Split into 'words'
 * @src https://stackoverflow.com/questions/18473326/javascript-break-sentence-by-words
 */
export function wordsFromText(text: string, locales = 'en'): string[] {
    if (typeof Intl === 'undefined' || typeof Intl.Segmenter === 'undefined') {
        return (text.match(/\b(\w+)'?(\w+)?\b/g) || []).filter(Boolean);
    }

    const wordSplitter = new Intl.Segmenter(locales, {
        granularity: 'word'
    });

    return Array.from(wordSplitter.segment(text), segment => {
        if (!segment.isWordLike) {
            return null;
        }
        return segment.segment;
    }).filter(Boolean);
}

export function wordCount(text: string): number {
    return wordsFromText(text).length;
}

export function numberAsSignedStr(num: number): string {
    return num >= 0 ? `+${num}` : `${num}`;
}

export function round1DP(num: number): number {
    return Math.round(num * 10) / 10;
}

export function roundNDP(num: number, n: number): number {
    return Math.round(num * 10 ** n) / 10 ** n;
}

export function rawMdToHtml(md: string, obfuscated = false): string {
    // this is pretty dumb...
    // https://github.com/markedjs/marked/issues/2793
    marked.use({
        mangle: false,
        headerIds: false
    });

    return DomPurify.sanitize(marked.parse(obfuscated ? obfuscate(md) : md));
}

export function limitStrLen(str: string, len: number, append = '..'): string {
    if (str.length <= len) {
        return str;
    }
    return `${str.substring(0, len - 1)}${append}`;
}

export function fmtBytes(bytes: number): string {
    if (bytes < 0) {
        return `-${fmtBytes(-bytes)}`;
    }
    if (bytes < 1000) {
        return `${bytes}B`;
    }
    if (bytes < 1000 * 1000) {
        return `${round1DP(bytes / 1000)}KB`;
    }
    if (bytes < 1000 * 1000 * 1000) {
        return `${round1DP(bytes / 1000 / 1000)}MB`;
    }
    return `${round1DP(bytes / 1000 / 1000 / 1000)}GB`;
}

export function removeAnsi(str: string): string {
    return str.replace(
        // eslint-disable-next-line no-control-regex
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        ''
    );
}

export function capitalise(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
