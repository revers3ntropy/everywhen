import '@total-typescript/ts-reset';
import type { COOKIE_KEYS } from '$lib/constants';
import type { SettingsConfig } from '$lib/controllers/settings/settings';
import type { Auth } from '$lib/controllers/auth/auth';

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

    type RawCookies = { [K in keyof typeof COOKIE_KEYS]?: string };

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
