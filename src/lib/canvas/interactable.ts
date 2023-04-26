import { getContext, onMount } from 'svelte';
import type { CursorStyle } from '../../app';
import { DEBUG_RENDER_COLLIDERS } from '../constants';
import type { TimestampSecs } from '../utils/types';
import {
    type CanvasContext,
    canvasState,
    type ContextMenuOptions,
    key,
    type Listener
} from './canvasState';
import type { RenderProps } from './canvasState';
import type { Collider } from './collider';

export interface Interactable extends Listener {
    onHover?: (time: TimestampSecs, y: number) => void;
    onMouseUp?: (time: TimestampSecs, y: number) => void;
    collider?: (props: RenderProps) => Collider | null;
    cursorOnHover?: CursorStyle;
    contextMenu?: ContextMenuOptions;
}

export function interactable(interactable: Interactable): void {
    let wasHovering = false;

    const ctx: CanvasContext = getContext(key);

    const element = {
        ready: false,
        mounted: false,
        hovering: false,
        render(state, dt) {
            if (interactable.hovering) {
                if (interactable.cursorOnHover) {
                    canvasState.update(s => {
                        s.cursor = interactable.cursorOnHover || 'default';
                        return s;
                    });
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
        return () => {
            ctx.remove(element);
            element.mounted = false;
        };
    });
}
