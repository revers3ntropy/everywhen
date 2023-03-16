import { browser } from '$app/environment';
import { error } from '@sveltejs/kit';
import { parse } from 'cookie';
import * as crypto from 'crypto';
import type { Schema, SchemaResult } from 'schemion';
import schemion from 'schemion';
import type { Position } from 'svelte-notifications';
import { bind } from 'svelte-simple-modal';
import type { SvelteComponentDev } from 'svelte/internal';
import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';
import { KEY_COOKIE_KEY, OBFUSCATE_CHARS, popup, USERNAME_COOKIE_KEY } from './constants';
import type { RawAuth } from './controllers/user';

export interface NotificationOptions {
    id?: string;
    text?: string;
    position: Position;
    type?: string;
    removeAfter?: number;
}

export type Mutable<T> = {
    -readonly [P in keyof T]: T[P]
};

type NonFunctionPropertyNames<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export type PickOptionalAndMutable<A, B extends keyof A> =
    NonFunctionProperties<Omit<Readonly<A>, B>
                          & Partial<Mutable<Pick<A, B>>>>;

export type PickOptional<A, B extends keyof A = keyof A> =
    NonFunctionProperties<Omit<A, B>
                          & Partial<Pick<A, B>>>;

export type Seconds = number;
export type TimestampSecs = number;
export type Milliseconds = number;

const RESULT_NULL = Symbol();

export class Result<T = null, E extends {} = string> {

    public static readonly NULL = RESULT_NULL;

    private constructor (
        private readonly value: T | typeof RESULT_NULL = RESULT_NULL,
        private readonly error: E | typeof RESULT_NULL = RESULT_NULL,
    ) {
    }

    public get err (): E | null {
        if (this.error === RESULT_NULL) {
            return null;
        }
        return this.error;
    }

    public get val (): T {
        if (this.value === RESULT_NULL) {
            return undefined as T;
        }
        return this.value;
    }

    public get isOk (): boolean {
        return this.value !== RESULT_NULL;
    }

    public get isErr (): boolean {
        return this.error !== RESULT_NULL;
    }

    public static collect<T, E extends {}> (
        iter: Result<T, E>[],
    ): Result<T[], E> {
        const results: T[] = [];
        for (const result of iter) {
            if (result.err) {
                return Result.err(result.err);
            }
            results.push(result.val);
        }
        return Result.ok(results);
    }

    public static async awaitCollect<T, E extends {}> (
        iter: Promise<Result<T, E>>[],
    ): Promise<Result<T[], E>> {
        return Result.collect(await Promise.all(iter));
    }

    public static ok<T, E extends {}> (value: T): Result<T, E> {
        return new Result<T, E>(value, RESULT_NULL);
    }

    public static err<T, E extends {}> (error: E): Result<T, E> {
        return new Result<T, E>(RESULT_NULL, error);
    }

    public unwrap (): T {
        if (this.value === RESULT_NULL) {
            throw `Got error when unwrapping Result: '${String(this.error)}'`;
        }
        return this.value;
    }

    public map<U> (f: (value: T) => U): Result<U, E> {
        if (this.value === RESULT_NULL) {
            return this as unknown as Result<U, E>;
        }
        return Result.ok(f(this.value));
    }
}

export const ERR_NOTIF_CONFIG = Object.freeze({
    removeAfter: 8000,
    text: 'An error has occurred',
    type: 'error',
    position: 'top-center',
});

export function getRawAuthFromCookies (): RawAuth {
    if (!browser) {
        throw 'getRawAuthFromCookies() can only be used in the browser';
    }
    return {
        key: parse(document.cookie)[KEY_COOKIE_KEY],
        username: parse(document.cookie)[USERNAME_COOKIE_KEY],
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
    onClose: (() => T | void) = (() => void 0),
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

function readFileAsB64 (file: File): Promise<Result<string>> {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(Result.ok(reader.result?.toString() || ''));
        };
        reader.onerror = () => {
            resolve(Result.err('Error reading file'));
        };
        reader.readAsDataURL(file);
    });
}

export async function getFileContents (
    file: File,
    encoding: 'UTF-8' | 'b64' = 'UTF-8',
): Promise<Result<string>> {
    if (encoding === 'b64') {
        return await readFileAsB64(file);
    }
    return await new Promise((resolve) => {
        const reader = new FileReader();
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
        reader.readAsText(file, encoding);
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

export function splitText (text: string): string[] {
    return text.split(/[\s,.\-:;!"*()=+\[\]{}?|]+/)
               .filter(Boolean);
}

export function wordCount (text: string): number {
    return splitText(text).length;
}

export async function bodyFromReq<T extends Schema & object> (
    request: Request,
    schema: T,
    defaults: { [P in keyof T]?: SchemaResult<T[P]> | undefined; } = {},
): Promise<Result<Readonly<SchemaResult<T>>>> {
    if (request.method === 'GET') {
        throw 'GET requests are not supported in bodyFromReq()';
    }

    const contentType = request.headers.get('content-type');
    if (contentType !== 'application/json') {
        return Result.err('Invalid content type on body');
    }

    const body = await request.json() as Record<string, unknown> | null;
    if (typeof body !== 'object' || body === null) {
        return Result.err('Invalid body: not JSON');
    }

    if (!schemion.matches(
        body,
        schema,
        defaults as T extends object ? { [P in keyof T]?: SchemaResult<T[P]> | undefined; } | null : null,
        { strict: true },
    )) {
        return Result.err(`Invalid body: does not match expected schema`);
    }

    return Result.ok(Object.freeze(
        body as SchemaResult<T>,
    ));
}

export async function getUnwrappedReqBody<T extends Schema & object> (
    request: Request,
    valueType: T,
    defaults: { [P in keyof T]?: SchemaResult<T[P]> } = {},
): Promise<Readonly<SchemaResult<T>>> {
    const res = await bodyFromReq(request, valueType, defaults);
    if (res.err) {
        throw error(400, res.err);
    }
    return res.val;
}

export function nowS (): Seconds {
    return Math.floor(Date.now() / 1000);
}

export function cryptoRandomStr (length = 32): string {
    return crypto
        .randomBytes(length)
        .toString('base64url');
}

export function displayNotifOnErr<T> (
    addNotification: (notification: NotificationOptions) => void,
    { err, val }: Result<T>,
    options: PickOptional<NotificationOptions> = {},
): T {
    if (err) {
        try {
            err = (JSON.parse(err) as any)?.message
                || err;
        } catch (e) {
        }
        addNotification({
            removeAfter: 8000,
            text: err || 'Unknown error',
            type: 'error',
            position: 'top-center',
            ...options,
        });
        throw err;
    }
    return val;
}

export function fmtTimestampForInput (timestamp: Seconds): string {
    return new Date(timestamp * 1000)
        .toISOString()
        .split('.')[0];
}

export function parseTimestampFromInput (timestamp: string): Seconds {
    return Math.floor(Date.parse(timestamp) / 1000);
}

export function localStorageWritable<T> (
    lsKey: string,
    initial: T extends Function ? never : T,
): Writable<T> {

    if (typeof initial === 'function') {
        throw new Error('localStorageWritable does not support setting a function');
    }

    if (browser) {
        const lsVal = localStorage.getItem(lsKey);
        if (lsVal !== null) {
            try {
                initial = JSON.parse(lsVal) as T extends Function ? never : T;
            } catch (e) {
                console.error('Error parsing localStorage value', e);
            }
        }

        localStorage.setItem(lsKey, JSON.stringify(initial));
    }

    const store = writable<T>(initial);

    const { subscribe, set, update } = store;

    return {
        subscribe,
        set: (value) => {
            if (typeof value === 'function') {
                throw new Error('localStorageWritable does not support setting a function');
            }
            set(value);
            if (!browser) return;
            if (value === null || value === undefined) {
                localStorage.removeItem(lsKey);
                return;
            }
            localStorage.setItem(lsKey, JSON.stringify(value));
        },
        update: (fn) => {
            update((value) => {
                const newValue = fn(value);

                if (typeof newValue === 'function') {
                    throw new Error('localStorageWritable does not support setting a function');
                }

                if (!browser) return newValue;
                if (newValue === null || newValue === undefined) {
                    localStorage.removeItem(lsKey);
                } else {
                    localStorage.setItem(lsKey, JSON.stringify(newValue));
                }
                return newValue;
            });
        },
    };
}

export class GenericResponse<T extends Record<string, unknown>> extends Response {
    constructor (val: string, init: ResponseInit) {
        super(val, init);
    }

    protected _ (): T {
        throw new Error('This method should never be called');
    }
}

export function apiResponse<T extends Record<string, unknown>> (
    body: T,
    init: ResponseInit = {},
): GenericResponse<T> {
    return new Response(
        JSON.stringify(body),
        {
            status: 200,
            ...init,
        },
    ) as GenericResponse<T>;
}

export function GETParamIsTruthy (val: string | null = null): boolean {
    return val && val === 'true' || val === '1';
}