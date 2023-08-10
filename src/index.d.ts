declare module '@svelte-plugins/tooltips' {
    import type { ActionReturn } from 'svelte/action';

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

declare module 'svelte-heatmap';

declare module 'crypto-browserify';
