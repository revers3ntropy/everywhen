import { browser } from '$app/environment';
import { error } from '@sveltejs/kit';
import { parse } from 'cookie';
import * as crypto from 'crypto';
import type { Position } from 'svelte-notifications';
import { bind } from 'svelte-simple-modal';
import type { SvelteComponentDev } from 'svelte/internal';
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

export type PickOptional<A, B extends keyof A> =
    NonFunctionProperties<Omit<A, B>
                          & Partial<Pick<A, B>>>;

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
            throw `Got error when unwrapping Result: '${String(this.error)}'`;
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

    public map<U> (f: (value: T) => U): Result<U, E> {
        if (this.value === RESULT_NULL) {
            return this as unknown as Result<U, E>;
        }
        return Result.ok(f(this.value));
    }
}

export function getAuthFromCookies (): RawAuth {
    if (!browser) {
        throw 'getKey() can only be used in the browser';
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


type typeMap = {
    string: string;
    number: number;
    boolean: boolean;
    object: object;
    undefined: undefined;
    function: Function;
};

function typesMatch (a: unknown, b: keyof typeMap): boolean {
    return typeof a === b;
}

export function objectMatchesSchema<T extends Record<string, keyof typeMap>> (
    obj: unknown,
    schema: T,
    defaults: { [P in keyof T]?: typeMap[T[P]] } = {},
): obj is { [P in keyof T]: typeMap[T[P]] } {

    if (typeof obj !== 'object' || obj === null) {
        return false;
    }

    // clone so can safely mutate (adding defaults)
    let objClone: Record<string, unknown> = { ...obj };
    for (const key in defaults) {
        objClone[key] ??= defaults[key];
    }

    for (const key in schema) {
        if (!typesMatch(objClone[key], schema[key])) {
            return false;
        }
    }
    return true;
}

export function objectMatchesSchemaStrict<T extends Record<string, keyof typeMap>> (
    obj: unknown,
    schema: T,
    defaults: { [P in keyof T]?: typeMap[T[P]] } = {},
): obj is { [P in keyof T]: typeMap[T[P]] } {

    if (typeof obj !== 'object' || obj === null) {
        return false;
    }

    // add defaults here so can check length of list of keys properly
    let objClone: Record<string, unknown> = { ...obj };
    for (const key in defaults) {
        objClone[key] ??= defaults[key];
    }

    return Object.keys(objClone).length === Object.keys(schema).length &&
        objectMatchesSchema(objClone, schema);
}

export async function bodyFromReq<T extends Record<string, keyof typeMap>> (
    request: Request,
    schema: T,
    defaults: { [P in keyof T]?: typeMap[T[P]] } = {},
): Promise<Result<Readonly<{ [P in keyof T]: typeMap[T[P]] }>>> {
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

    if (!objectMatchesSchemaStrict(body, schema, defaults)) {
        return Result.err(`Invalid body: does not match expected schema`);
    }

    return Result.ok(Object.freeze(
        body as { [P in keyof T]: typeMap[T[P]] },
    ));
}

export async function getUnwrappedReqBody<T extends Record<string, keyof typeMap>> (
    request: Request,
    valueType: T,
    defaults: { [P in keyof T]?: typeMap[T[P]] } = {},
): Promise<Readonly<{ [P in keyof T]: typeMap[T[P]] }>> {
    const res = await bodyFromReq(request, valueType, defaults);
    if (res.err) {
        throw error(400, res.err);
    }
    return res.val;
}

export function nowS (): number {
    return Math.floor(Date.now() / 1000);
}

export function cryptoRandomStr (length = 32): string {
    return crypto
        .randomBytes(length)
        .toString('base64url');
}