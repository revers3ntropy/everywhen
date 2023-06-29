import { getContext, onMount } from 'svelte';
import { DEBUG_RENDER_COLLIDERS } from '$lib/constants';
import {
    type CanvasContext,
    CanvasState,
    type ContextMenuOptions,
    key,
    type Listener
} from './canvasState';
import type { RenderProps } from './canvasState';
import type { Collider } from './collider';

export interface Interactable extends Listener {
    onHover?: (time: TimestampSecs, y: number) => void;
    onMouseUp?: (state: RenderProps, time: TimestampSecs, y: number) => void;
    collider?: (state: RenderProps) => Collider | null;
    cursorOnHover?: CursorStyle;
    contextMenu?: ContextMenuOptions;
}

export function interactable(interactable: Interactable): void {
    let wasHovering = false;

    const ctx = getContext<CanvasContext>(key);

    const element = {
        ready: false,
        mounted: false,
        hovering: false,
        render(state, dt) {
            if (interactable.hovering) {
                if (interactable.cursorOnHover) {
                    (state as CanvasState).cursor = interactable.cursorOnHover || 'default';
                }

                if (!wasHovering && interactable.onHover) {
                    interactable.onHover(state.mouseTime, state.mouseY);
                }
            }
            wasHovering = !!interactable.hovering;

            if (DEBUG_RENDER_COLLIDERS) {
                const collider = interactable.collider?.(state);
                if (collider) {
                    collider.debugDraw(state);
                }
            }

            return interactable.render?.(state, dt);
        },

        setup(state) {
            state.registerInteractable(interactable);
            return interactable.setup?.(state);
        }
    } as Listener;

    void ctx.add(element);
    onMount(() => {
        element.mounted = true;
        interactable.mounted = true;
        return () => {
            ctx.remove(element);
            interactable.mounted = false;
            element.mounted = false;
        };
    });
}
