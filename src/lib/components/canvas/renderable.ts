import { getContext, onMount } from 'svelte';
import { key, type Listener } from './canvasState';
import type { CanvasContext, RenderCallback, SetupCallback } from './canvasState';

export interface Renderable {
    render?: RenderCallback;
    setup?: SetupCallback;
}

export function renderable(render?: RenderCallback | Renderable): void {
    const ctx: CanvasContext = getContext(key);
    const element = {
        ready: false,
        mounted: false
    } as Listener;

    if (typeof render === 'function') {
        element.render = render;
    } else if (render) {
        if (render.render) {
            element.render = render.render;
        }
        if (render.setup) {
            element.setup = render.setup;
        }
    }

    void ctx.add(element);
    onMount(() => {
        element.mounted = true;
        return () => {
            ctx.remove(element);
            element.mounted = false;
        };
    });
}
