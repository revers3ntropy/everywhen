import '@total-typescript/ts-reset';
import type { Event } from '$lib/controllers/event';
import type { SettingsConfig } from '$lib/controllers/settings';
import type { Auth } from '$lib/controllers/user';

export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
type NonFunctionPropertyNames<T> = {
    [K in keyof T]: T[K] extends (...args: infer _) => infer _ ? never : K;
}[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
export type PickOptionalAndMutable<
    A,
    B extends keyof A
> = NonFunctionProperties<Omit<Readonly<A>, B> & Partial<Mutable<Pick<A, B>>>>;
export type PickOptional<
    A,
    B extends keyof A = keyof A
> = NonFunctionProperties<Omit<A, B> & Partial<Pick<A, B>>>;

export type Bytes = number;
export type Pixels = number;
export type Hours = number;
export type Seconds = number;
export type TimestampSecs = number;
export type Milliseconds = number;
export type Degrees = number;
export type Meters = number;

export type EventsSortKey = keyof Omit<Event, 'id' | 'decrypted'>;

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

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
    interface PageData extends Auth {
        settings: SettingsConfig;
    }

    // interface Error {}
    // interface Locals {}
    // interface Platform {}
}

declare global {
    declare interface String {
        toLowerCase(): Lowercase<string>;
    }

    // loaded in with Vite on build from package.json
    declare const __VERSION__: string;

    // See https://kit.svelte.dev/docs/types#app
    namespace App {
        interface PageData extends Auth {
            key: string;
            username: string;
            id: string;
            settings: SettingsConfig;
            path: string;
        }

        // interface Error {}
        // interface Locals {}
        // interface Platform {}
    }

    // Polyfill for filedrop-svelte package
    declare type FileDropEvent = import('filedrop-svelte/event').FileDropEvent;
    declare type FileDropSelectEvent =
        import('filedrop-svelte/event').FileDropSelectEvent;
    declare type FileDropDragEvent =
        import('filedrop-svelte/event').FileDropDragEvent;
    declare namespace svelte.JSX {
        interface HTMLAttributes<T> {
            onfiledrop?: (
                event: CustomEvent<FileDropSelectEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            onfiledragenter?: (
                event: CustomEvent<FileDropDragEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            onfiledragleave?: (
                event: CustomEvent<FileDropDragEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            onfiledragover?: (
                event: CustomEvent<FileDropDragEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            onfiledialogcancel?: (
                event: CustomEvent<FileDropEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            onfiledialogclose?: (
                event: CustomEvent<FileDropEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            onfiledialogopen?: (
                event: CustomEvent<FileDropEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            onwindowfiledragenter?: (
                event: CustomEvent<FileDropDragEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            onwindowfiledragleave?: (
                event: CustomEvent<FileDropDragEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
            onwindowfiledragover?: (
                event: CustomEvent<FileDropDragEvent> & {
                    target: EventTarget & T;
                }
            ) => void;
        }
    }
}

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
