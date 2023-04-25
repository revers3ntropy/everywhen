import '@total-typescript/ts-reset';
import type { SettingsConfig } from './lib/controllers/settings';
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
    interface PageData extends Auth {
        settings: SettingsConfig;
    }

    // interface Error {}
    // interface Locals {}
    // interface Platform {}
}

declare global {
    interface String {
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

    declare module '@svelte-plugins/tooltips' {
        export function tooltip(
            el: HTMLElement,
            props: {
                content: string;
                placement?: 'top' | 'bottom' | 'left' | 'right';
                offset?: number;
            }
        ): unknown;
    }

    // Very annoying, but otherwise `svelte-check` complains about
    // `import '@svelte-plugins/tooltips'`
    declare module '*';
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
