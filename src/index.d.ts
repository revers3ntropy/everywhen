/// <reference lib="dom" />

declare module '@svelte-plugins/tooltips' {
    import type { ActionReturn } from 'svelte/action';
    import type { TooltipPosition } from './types';

    export function tooltip(
        el: HTMLElement,
        props: {
            content: string;
            position?: TooltipPosition;
            offset?: number;
            autoPosition?: boolean;
        }
    ): ActionReturn;
}

declare module 'crypto-browserify';
