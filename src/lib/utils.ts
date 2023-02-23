import { parse } from "cookie";
import { browser } from "$app/environment";
import { KEY_COOKIE_KEY, OBFUSCATE_CHARS, popup, USERNAME_COOKIE_KEY } from "./constants";
import { bind } from "svelte-simple-modal";
import type { SvelteComponentDev } from "svelte/internal";
import type { Auth } from "./controllers/user";

export class Result<T, E=string> {
    private constructor (
        private readonly value: T | null = null,
        private readonly error: E | null = null
    ) {
    }

    public get err (): E | null {
        return this.error;
    }

    public get val (): T | null {
        return this.value;
    }

    public static ok<T, E> (value: T): Result<T, E> {
        return new Result<T, E>(value, null);
    }

    public static err<T, E> (error: E): Result<T, E> {
        return new Result<T, E>(null, error);
    }

    public get isOk (): boolean {
        return this.value !== null;
    }

    public get isErr (): boolean {
        return this.error !== null;
    }

    public unwrap (): T {
        if (this.value === null) {
            throw this.error;
        }
        return this.value;
    }

    public unwrapErr (): E {
        if (this.error === null) {
            throw this.value;
        }
        return this.error;
    }

    public map<U> (f: (value: T) => U): Result<U, E> {
        if (this.value === null) {
            return Result.err(this.error as E);
        }
        return Result.ok(f(this.value));
    }
}

export function getAuth (): Auth {
    if (!browser) {
        throw "getKey() can only be used in the browser";
    }
    return {
        key: parse(document.cookie)[KEY_COOKIE_KEY],
        username: parse(document.cookie)[USERNAME_COOKIE_KEY]
    };
}

export function obfuscate (str: string, alphabet = OBFUSCATE_CHARS): string {
    return str.replace(/./g, (char) => {
        if (char === "\n") return char;
        return alphabet[Math.floor(Math.random() * alphabet.length)];
    });
}

export function GETArgs (args: Record<string, any>): string {
    return "?" + Object.keys(args)
        .map((key) => `${ key }=${ args[key] }`)
        .join("&");
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
        if (value === boundEl) return;
        unsubscribe();

        return onClose();
    });
}

export async function getFileContents (file: File, encoding = "UTF-8")
    : Promise<Result<string, string>> {
    const reader = new FileReader();
    reader.readAsText(file, encoding);

    return await new Promise((resolve) => {
        reader.onload = evt => {
            const res = evt.target?.result?.toString?.();
            if (!res && res !== "") {
                resolve(Result.err("Error reading file"));
            }
            resolve(Result.ok(res || ""));
        };
        reader.onerror = async () => {
            resolve(Result.err("Error reading file"));
        };
    });
}

export function download (filename: string, text: string) {
    const element = document.createElement("a");
    const elData = "data:text/plain;charset=utf-8," + encodeURIComponent(text);
    element.setAttribute("href", elData);
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

export function wordCount (text: string): number {
    return text.split(/[\s,.\-:;!"*()=+\[\]{}?|]+/).filter(Boolean).length;
}