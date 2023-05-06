declare module '@svelte-plugins/tooltips' {
    import type { ActionReturn } from 'svelte/action';
    import type { TooltipPosition } from './app';

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

declare class WebpConverter {
    static str2webpstr(
        str: string,
        type: string,
        options: string
    ): Promise<string>;
}

declare module 'webp-converter' {
    export = WebpConverter;
}

declare module 'svelte-heatmap';
