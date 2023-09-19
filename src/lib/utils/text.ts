import DomPurify from 'dompurify';
import { marked } from 'marked';

export function normaliseWordForIndex(word: string): string {
    return word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function intlSegmenterSupported() {
    return typeof Intl !== 'undefined' && typeof Intl.Segmenter !== 'undefined';
}

const wordSplitter = intlSegmenterSupported()
    ? new Intl.Segmenter('en', {
          granularity: 'word'
      })
    : (null as unknown as Intl.Segmenter);

function wordsFromTextWithIntl(text: string): string[] {
    return Array.from(wordSplitter.segment(text), segment => {
        if (!segment.isWordLike) {
            return null;
        }
        return segment.segment;
    })
        .filter(Boolean)
        .map(word => word.toLowerCase().replace(/[^a-z0-9 ]/g, ''));
}

function wordsFromTextWithoutIntl(text: string): string[] {
    return text
        .replace(/\s+/g, ' ')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .split(' ')
        .filter(Boolean)
        .map(word => word.toLowerCase());
}

export const wordsFromText = intlSegmenterSupported()
    ? wordsFromTextWithIntl
    : wordsFromTextWithoutIntl;

export function wordCount(text: string): number {
    return wordsFromText(text).length;
}

export function numberAsSignedStr(num: number): string {
    return num >= 0 ? `+${num}` : `${num}`;
}

export function roundToDecimalPlaces(num: number, n: number = 1): number {
    return Math.round(num * 10 ** n) / 10 ** n;
}

export function rawMdToHtml(md: string): string {
    return DomPurify.sanitize(marked.parse(md));
}

export function limitStrLen(str: string, len: number, append = '..'): string {
    if (str.length <= len) {
        return str;
    }
    return `${str.substring(0, len - 1)}${append}`;
}

export function fmtBytes(bytes: number, precision = 3): string {
    if (bytes < 0) {
        return `-${fmtBytes(-bytes)}`;
    }
    if (bytes < 100) {
        return `${bytes}B`;
    }
    if (bytes < 1000) {
        return `${bytes.toPrecision(precision)}B`;
    }
    if (bytes < 1000 * 1000) {
        return `${(bytes / 1000).toPrecision(precision)}KB`;
    }
    if (bytes < 1000 * 1000 * 1000) {
        return `${(bytes / 1000 / 1000).toPrecision(precision)}MB`;
    }
    return `${(bytes / 1000 / 1000 / 1000).toPrecision(precision)}GB`;
}

export function fmtTimePrecise(ms: number, precision = 3): string {
    if (ms < 100) {
        return `${ms.toPrecision(2)}ms`;
    }
    if (ms < 1000) {
        return `${ms.toPrecision(precision)}ms`;
    }
    if (ms < 1000 * 60) {
        return `${(ms / 1000).toPrecision(precision)}s`;
    }
    if (ms < 1000 * 60 * 60) {
        return `${(ms / 1000 / 60).toPrecision(precision)}m`;
    }
    return `${(ms / 1000 / 60 / 60).toPrecision(precision)}h`;
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

export function collapseWhitespace(str: string): string {
    return str.replace(/\n/g, ' ').replace(/\s+/g, ' ').replace(`'`, `\\'`).trim();
}

export function recursivelyTrimAndStringify<T>(
    obj: T,
    maxStrLen = 10,
    maxKeys = 3,
    depth = 0
): string {
    if (depth > 10) {
        return '...';
    }
    if (typeof obj === 'string') {
        if (obj.length > maxStrLen) {
            return `'${collapseWhitespace(obj.slice(0, maxStrLen))}'..${obj.length - maxStrLen}`;
        }
        return `'${collapseWhitespace(obj)}'`;
    } else if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
            if (obj.length > maxKeys) {
                return (
                    '[' +
                    obj
                        .slice(0, maxKeys)
                        .map(o => recursivelyTrimAndStringify(o, maxStrLen, maxKeys, depth + 1))
                        .join(', ') +
                    `, ..${obj.length - maxKeys}]`
                );
            }
            return (
                '[' +
                obj
                    .map(o => recursivelyTrimAndStringify(o, maxStrLen, maxKeys, depth + 1))
                    .join(', ') +
                ']'
            );
        }
        const objectEntries = Object.entries(obj).map(([k, v]) => [
            k,
            recursivelyTrimAndStringify(v, maxStrLen, maxKeys, depth + 1)
        ]);
        if (objectEntries.length > maxKeys) {
            return (
                '{' +
                objectEntries
                    .slice(0, maxKeys)
                    .map(([k, v]) => ` ${k}: ${v}`)
                    .join(',') +
                `, ..${objectEntries.length - maxKeys} }`
            );
        }
        return '{' + objectEntries.map(([k, v]) => ` ${k}: ${v}`).join(', ') + ' }';
    }
    return obj + '';
}
