<script lang="ts">
    import { canvasState } from '$lib/components/canvas/canvasState';
    import { RectCollider } from '$lib/components/canvas/collider';
    import { interactable } from '$lib/components/canvas/interactable';
    import type { Label } from '$lib/controllers/label/label';
    import { makeStandardContextMenu } from './standardContextMenu';

    export let labels: Label[];

    interactable({
        dragging: false,
        dragStart: 0,
        setup(state) {
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

            state.listen('touchmove', evt => {
                evt.preventDefault();
                if (!this.dragging) return;

                const dragEnd = state.getMouseXRaw(evt);

                state.moveX(this.dragStart - dragEnd);
                this.dragStart = dragEnd;
            });

            state.listen('touchend', () => {
                this.dragging = false;
            });
            state.listen('mouseup', () => {
                this.dragging = false;
            });
        },

        collider(state) {
            return new RectCollider(0, 0, state.width, state.height, { zIndex: -4 });
        },

        onMouseDown(state, time) {
            this.dragStart = state.timeToX(time);
            this.dragging = true;
        },

        contextMenu: makeStandardContextMenu(labels, canvasState)
    });
</script>

<slot />
