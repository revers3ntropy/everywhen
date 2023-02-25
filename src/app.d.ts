import '@total-typescript/ts-reset';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
    interface Locals {
        //userid: string;
    }

    // interface PageData {}

    // interface Platform {}
}

declare module '$env/static/private' {
    export const DB_HOST: string;
    export const DB_USER: string;
    export const DB_PASS: string;
    export const DB: string;
    export const DB_PORT: string;
    export const INIT_VECTOR: string;
}

declare module '$env/static/public' {
    export const PUBLIC_SVELTEKIT_PORT: string;
}

declare global {
    interface String {
        toLowerCase (): Lowercase<string>;
    }
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