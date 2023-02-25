import { parse } from 'cookie';
import { browser } from '$app/environment';
import { KEY_COOKIE_KEY, OBFUSCATE_CHARS, popup, USERNAME_COOKIE_KEY } from './constants';
import { bind } from 'svelte-simple-modal';
import type { SvelteComponentDev } from 'svelte/internal';
import type { Auth } from './controllers/user';
import type { Position } from 'svelte-notifications';

export interface NotificationOptions {
    id?: string;
    text?: string;
    position: Position;
    type?: string;
    removeAfter?: number;
}

const NULL = Symbol();

export class Result<T = null, E = string> {

    public static readonly NULL = NULL;

    private constructor (
        private readonly value: T | typeof NULL = NULL,
        private readonly error: E | typeof NULL = NULL
    ) {
    }

    public get err (): E | typeof NULL {
        return this.error;
    }

    public get val (): T | typeof NULL {
        return this.value;
    }

    public get isOk (): boolean {
        return this.value !== NULL;
    }

    public get isErr (): boolean {
        return this.error !== NULL;
    }

    public static ok<T, E> (value: T): Result<T, E> {
        return new Result<T, E>(value, NULL);
    }

    public static err<T, E> (error: E): Result<T, E> {
        return new Result<T, E>(NULL, error);
    }

    public unwrap (): T {
        if (this.value === NULL) {
            throw this.error;
        }
        return this.value;
    }

    public unwrapErr (): E {
        if (this.error === NULL) {
            throw this.value;
        }
        return this.error;
    }

    public map<U> (f: (value: T) => U): Result<U, E> {
        if (this.value === NULL) {
            return this as unknown as Result<U, E>;
        }
        return Result.ok(f(this.value));
    }

    /**
     * Must not use `val` unless checked that `err` is null
     */
    public resolve (): { err: E | null, val: T } {
        return {
            err: this.error === NULL ? null : this.error as E,
            val: this.value as T
        };
    }
}

export function getAuth (): Auth {
    if (!browser) {
        throw 'getKey() can only be used in the browser';
    }
    return {
        key: parse(document.cookie)[KEY_COOKIE_KEY],
        username: parse(document.cookie)[USERNAME_COOKIE_KEY]
    };
}

export function obfuscate (str: string, alphabet = OBFUSCATE_CHARS): string {
    return str.replace(/./g, (char) => {
        if (char === '\n') {
            return char;
        }
        return alphabet[Math.floor(Math.random() * alphabet.length)];
    });
}

export function GETArgs (args: Record<string, any>): string {
    return '?' + Object.keys(args)
                       .map((key) => `${key}=${args[key]}`)
                       .join('&');
}

export function showPopup<T> (
    el: typeof SvelteComponentDev,
    props: Record<string, any>,
    onClose: (() => T | void) = (() => void 0)
) {
    const boundEl = bind(el, props);
    popup.set(boundEl);

    // not a very nice solution but I can't think of any other way
    // without creating a custom popup component which would just
    // be a pain
    const unsubscribe = popup.subscribe(async (value) => {
        if (value === boundEl) {
            return;
        }
        unsubscribe();

        return onClose();
    });
}

export async function getFileContents (file: File, encoding = 'UTF-8')
    : Promise<Result<string, string>> {
    const reader = new FileReader();
    reader.readAsText(file, encoding);

    return await new Promise((resolve) => {
        reader.onload = evt => {
            const res = evt.target?.result?.toString?.();
            if (!res && res !== '') {
                resolve(Result.err('Error reading file'));
            }
            resolve(Result.ok(res || ''));
        };
        reader.onerror = async () => {
            resolve(Result.err('Error reading file'));
        };
    });
}

export function download (filename: string, text: string) {
    const element = document.createElement('a');
    const elData = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
    element.setAttribute('href', elData);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

export function wordCount (text: string): number {
    return text.split(/[\s,.\-:;!"*()=+\[\]{}?|]+/)
               .filter(Boolean)
        .length;
}

export async function extractBody<T extends Record<string, void>> (request: Request, schema: T)
    : Promise<Result<Record<keyof T, unknown>>> {
    const contentType = request.headers.get('content-type');
    if (contentType !== 'application/json') {
        return Result.err('Invalid content type on body');
    }

    const body = await request.json();
    if (typeof body !== 'object' || body === null) {
        return Result.err('Invalid body: not JSON');
    }

    const objectsSame = Object.keys(schema)
                              .every((key) => key in Object.keys(body));
    if (!objectsSame) {
        return Result.err('Invalid body: invalid keys');
    }

    return Result.ok(body as Record<keyof T, unknown>);
}