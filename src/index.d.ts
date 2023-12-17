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

declare module 'svelte-simple-modal' {
    export function bind(component: Component, props: Record<string, unknown>): Component;
    export type Component = typeof import('svelte').SvelteComponent;
    import { SvelteComponentTyped } from 'svelte';
    import type { SvelteComponent } from 'svelte';
    class Modal extends SvelteComponentTyped<{
        classContent: string;
        classWindow: string;
        show: typeof SvelteComponent | null | undefined;
    }> {}
    export default Modal;
}
