import '@total-typescript/ts-reset';
import type { Auth } from './lib/controllers/user';


declare module '$env/static/private' {
    export const DB_HOST: string;
    export const DB_USER: string;
    export const DB_PASS: string;
    export const DB: string;
    export const DB_PORT: string;
}

declare module '$env/static/public' {
    export const PUBLIC_SVELTEKIT_PORT: string;
    export const PUBLIC_INIT_VECTOR: string;
}

// See https://kit.svelte.dev/docs/types#app
declare namespace App {

    interface PageData extends Auth {}

    // interface Error {}
    // interface Locals {}
    // interface Platform {}
}

declare global {
    interface String {
        toLowerCase (): Lowercase<string>;
    }

    // See https://kit.svelte.dev/docs/types#app
    namespace App {

        interface PageData {
            key: string;
            username: string;
            id: string;
        }

        // interface Error {}
        // interface Locals {}
        // interface Platform {}
    }

    // Polyfill for filedrop-svelte package
    declare type FileDropEvent = import('filedrop-svelte/event').FileDropEvent;
    declare type FileDropSelectEvent = import('filedrop-svelte/event').FileDropSelectEvent;
    declare type FileDropDragEvent = import('filedrop-svelte/event').FileDropDragEvent;
    declare namespace svelte.JSX {
        interface HTMLAttributes<T> {
            onfiledrop?: (event: CustomEvent<FileDropSelectEvent> & { target: EventTarget & T }) => void;
            onfiledragenter?: (event: CustomEvent<FileDropDragEvent> & { target: EventTarget & T }) => void;
            onfiledragleave?: (event: CustomEvent<FileDropDragEvent> & { target: EventTarget & T }) => void;
            onfiledragover?: (event: CustomEvent<FileDropDragEvent> & { target: EventTarget & T }) => void;
            onfiledialogcancel?: (event: CustomEvent<FileDropEvent> & { target: EventTarget & T }) => void;
            onfiledialogclose?: (event: CustomEvent<FileDropEvent> & { target: EventTarget & T }) => void;
            onfiledialogopen?: (event: CustomEvent<FileDropEvent> & { target: EventTarget & T }) => void;
            onwindowfiledragenter?: (event: CustomEvent<FileDropDragEvent> & { target: EventTarget & T }) => void;
            onwindowfiledragleave?: (event: CustomEvent<FileDropDragEvent> & { target: EventTarget & T }) => void;
            onwindowfiledragover?: (event: CustomEvent<FileDropDragEvent> & { target: EventTarget & T }) => void;
        }
    }
}