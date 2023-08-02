import '@total-typescript/ts-reset';
import { COOKIE_WRITEABLE_KEYS } from '$lib/constants';
import type { SettingsConfig } from '$lib/controllers/settings/settings';
import type { Auth } from '$lib/controllers/user/user';

declare module '$env/static/private' {
    export const DB_HOST: string;
    export const DB_USER: string;
    export const DB_PASS: string;
    export const DB: string;
    export const DB_PORT: string;
    export const GITHUB_AUTH_CLIENT_SECRET: string;
}

declare module '$env/static/public' {
    export const PUBLIC_SVELTEKIT_PORT: string;
    export const PUBLIC_INIT_VECTOR: string;
    export const PUBLIC_GITHUB_AUTH_CLIENT_ID: string;
}

declare global {
    declare interface String {
        toLowerCase(): Lowercase<string>;
    }

    type RawCookies = { [K in keyof typeof COOKIE_WRITEABLE_KEYS]?: string };

    // See https://kit.svelte.dev/docs/types#app
    declare namespace App {
        interface PageData {
            __cookieWritables: RawCookies;
        }

        interface Locals {
            auth: Auth | null;
            settings: SettingsConfig | null;
            __cookieWritables: RawCookies;
        }

        // interface Error {}
        // interface Platform {}
    }

    // loaded in with Vite on build from package.json
    declare const __VERSION__: string;

    // Polyfill for filedrop-svelte package
    declare type FileDropEvent = import('filedrop-svelte/event').FileDropEvent;
    declare type FileDropSelectEvent = import('filedrop-svelte/event').FileDropSelectEvent;
    declare type FileDropDragEvent = import('filedrop-svelte/event').FileDropDragEvent;
    declare namespace svelteHTML {
        interface HTMLAttributes<T> {
            'on:filedrop'?: (
                event: CustomEvent<FileDropSelectEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            'on:filedragenter'?: (
                event: CustomEvent<FileDropDragEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            'on:filedragleave'?: (
                event: CustomEvent<FileDropDragEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            'on:filedragover'?: (
                event: CustomEvent<FileDropDragEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            'on:filedialogcancel'?: (
                event: CustomEvent<FileDropEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            'on:filedialogclose'?: (
                event: CustomEvent<FileDropEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            'on:filedialogopen'?: (
                event: CustomEvent<FileDropEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            'on:windowfiledragenter'?: (
                event: CustomEvent<FileDropDragEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            'on:windowfiledragleave'?: (
                event: CustomEvent<FileDropDragEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            'on:windowfiledragover'?: (
                event: CustomEvent<FileDropDragEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
        }
    }
}

declare global {
    export type Mutable<T> = {
        -readonly [P in keyof T]: T[P];
    };
    type NonFunctionPropertyNames<T> = {
        [K in keyof T]: T[K] extends (...args: infer _) => infer _ ? never : K;
    }[keyof T];
    export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
    export type PickOptionalAndMutable<A, B extends keyof A> = NonFunctionProperties<
        Omit<Readonly<A>, B> & Partial<Mutable<Pick<A, B>>>
    >;
    export type PickOptional<A, B extends keyof A = keyof A> = NonFunctionProperties<
        Omit<A, B> & Partial<Pick<A, B>>
    >;

    export type MaybePromise<T> = T | Promise<T>;

    export type Bytes = number;
    export type Pixels = number;
    export type Hours = number;
    export type Seconds = number;
    export type TimestampSecs = number;
    export type TimestampMilliseconds = number;
    export type Milliseconds = number;
    export type Degrees = number;
    export type Meters = number;

    export type EventsSortKey = 'name' | 'start' | 'end' | 'created';

    export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

    export type CursorStyle =
        | 'pointer'
        | 'default'
        | 'none'
        | 'auto'
        | 'crosshair'
        | 'move'
        | 'sw-resize'
        | 'ns-resize'
        | 'nesw-resize'
        | 'nwse-resize'
        | 'text'
        | 'wait'
        | 'help'
        | 'progress'
        | 'copy'
        | 'alias'
        | 'context-menu'
        | 'cell'
        | 'vertical-text'
        | 'no-drop'
        | 'not-allowed'
        | 'zoom-in'
        | 'zoom-out'
        | 'grab'
        | 'grabbing'
        | 'all-scroll'
        | 'col-resize'
        | 'row-resize'
        | 'n-resize'
        | 'e-resize'
        | 's-resize'
        | 'w-resize'
        | 'ne-resize'
        | 'nw-resize'
        | 'se-resize'
        | 'ew-resize';
}
