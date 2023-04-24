import { getContext, onMount } from 'svelte';
import { key, type Listener } from './canvasHelpers';
import type { CanvasContext, RenderCallback, SetupCallback } from './canvasHelpers';

export interface Renderable {
    render?: RenderCallback;
    setup?: SetupCallback;
}

export function renderable (
    render?:
        | RenderCallback
        | Renderable
): void {
    const api: CanvasContext = getContext(key);
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

    void api.add(element);
    onMount(() => {
        element.mounted = true;
        return () => {
            api.remove(element);
            element.mounted = false;
        };
    });
}