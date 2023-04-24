import { getContext, onMount } from 'svelte';
import type { CursorStyle } from '../../app';
import type { Seconds, TimestampSecs } from '../utils/types';
import { type CanvasContext, canvasState, key, type Listener } from './canvasHelpers';
import type { RenderProps, SetupCallback } from './canvasHelpers';

interface Collider {
    colliding(x: number, y: number): boolean;
}

export class BoxCollider implements Collider {
    constructor (
        public readonly time: TimestampSecs,
        public readonly y: number,
        public readonly duration: Seconds,
        public readonly height: number
    ) {
    }

    colliding (time: number, y: number): boolean {
        return (
            time >= this.time &&
            time <= this.time + this.duration &&
            y >= this.y &&
            y <= this.y + this.height
        );
    }
}

export interface Interactable {
    onHover?: (time: TimestampSecs, y: number) => void;
    onClick?: (time: TimestampSecs, y: number) => void;
    render?: (
        props: RenderProps,
        hovering: boolean,
        dt: number
    ) => void | Promise<void>;
    setup?: SetupCallback;
    collider?: (
        props: RenderProps,
        hovering: boolean,
        dt: number
    ) => Collider | null;
    cursorOnHover?: CursorStyle
}

export function interactable (
    interactable: Interactable
): void {
    let hovering = false;

    function isHovering (props: RenderProps, dt: number): boolean {
        if (!interactable.collider) return false;

        const collider = interactable.collider(props, hovering, dt);

        if (!collider) return false;
        return collider.colliding(
            props.mouseTime,
            props.mouseY
        );
    }

    const ctx: CanvasContext = getContext(key);
    const element = {
        ready: false,
        mounted: false,
        render (props, dt) {
            const hoveringThisTick = isHovering(props, dt);
            if (hoveringThisTick) {
                if (interactable.cursorOnHover) {
                    canvasState.update(s => {
                        s.cursor = interactable.cursorOnHover || 'default';
                        return s;
                    });
                }

                if (!hovering && interactable.onHover) {
                    interactable.onHover(props.mouseTime, props.mouseY);
                }
            }
            hovering = hoveringThisTick;

            return interactable.render?.(
                props,
                hovering,
                dt
            );
        },

        setup (props) {
            if (interactable.onClick) {
                props.listen('mouseup', (event) => {
                    if (!hovering) return;

                    interactable.onClick?.(
                        props.getMouseTime(event),
                        props.getMouseYRaw(event)
                    );
                })
            }
            return interactable.setup?.(props);
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