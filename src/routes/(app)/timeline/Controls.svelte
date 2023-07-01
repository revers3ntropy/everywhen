<script lang="ts">
    import { canvasState } from '$lib/components/canvas/canvasState';
    import { RectCollider } from '$lib/components/canvas/collider';
    import { type Interactable, interactable } from '$lib/components/canvas/interactable.js';
    import type { Auth } from '$lib/controllers/user';
    import { makeContextMenu } from './standardContextMenu';

    export let auth: Auth;

    interactable({
        dragging: false,
        dragStart: 0,
        dragYStart: 0,
        setup(
            this: Interactable & { dragging: boolean; dragStart: number; dragYStart: number },
            state
        ) {
            // desktop

            state.listen('wheel', evt => {
                evt.preventDefault();
                state.zoomOnCenter(1 + evt.deltaY * -0.001);
            });

            state.listen('mousemove', evt => {
                if (!this.dragging) return;
                const dragEnd = state.getMouseXRaw(evt);

                const diff = this.dragStart - dragEnd;
                if (diff !== 0) {
                    state.moveX(diff);
                }

                this.dragStart = dragEnd;
            });

            // mobile

            state.listen('touchstart', event => {
                this.dragStart = state.getMouseXRaw(event);
                this.dragYStart = state.getMouseYRaw(event);
                this.dragging = true;
            });

            state.listen('touchend', () => {
                this.dragging = false;
            });

            state.listen('touchmove', evt => {
                evt.preventDefault();
                if (!this.dragging) return;

                const dragEnd = state.getMouseXRaw(evt);

                state.moveX(this.dragStart - dragEnd);
                this.dragStart = dragEnd;

                let dragYEnd = state.getMouseYRaw(evt);
                let mod = 1 + (dragYEnd - this.dragYStart) / 1000;
                if (mod > 0 && mod < 2) {
                    state.zoomOnCenter(mod);
                }

                this.dragYStart = dragYEnd;
            });
        },

        collider(state) {
            return new RectCollider(0, 0, state.width, state.height, { zIndex: -3 });
        },

        onMouseDown(state) {
            this.dragStart = state.timeToX(state.mouseTime);
            this.dragging = true;
        },

        onMouseUp() {
            this.dragging = false;
        },

        contextMenu: makeContextMenu(auth, canvasState)
    });
</script>

<slot />
