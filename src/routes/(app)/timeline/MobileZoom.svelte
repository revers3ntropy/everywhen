<script lang="ts">
    import { canvasState } from '$lib/components/canvas/canvasState';
    import { RectCollider } from '$lib/components/canvas/collider';
    import { interactable } from '$lib/components/canvas/interactable';
    import type { Label } from '$lib/controllers/label/label';
    import { makeStandardContextMenu } from './standardContextMenu';

    export let labels: Record<string, Label>;

    const WIDTH = 50;
    const BAR_WIDTH = 100;
    const BAR_HEIGHT = 30;
    const BAR_RADIUS = 5;

    const DRAG_COEFFICIENT = 1 / 500;

    // screen edge zooming
    interactable({
        dragging: false,
        dragStart: 0,

        render(state) {
            if (!this.dragging) return;

            state.rect(
                state.width - BAR_WIDTH,
                state.mouseY - BAR_HEIGHT / 2,
                BAR_WIDTH + BAR_RADIUS,
                BAR_HEIGHT,
                {
                    color: state.colors.primary,
                    zIndex: 2,
                    radius: BAR_RADIUS
                }
            );

            // fudge factor to make '1' be a sensible thing to show
            const showZoom = parseFloat((state.zoom * 100).toPrecision(2));

            let textX = state.width - BAR_WIDTH;
            textX += 2; // margin

            let textY = state.mouseY;
            textY -= 4; // margin

            state.text(`x${showZoom}`, textX, textY, {
                fontSize: 16,
                zIndex: 3
            });
        },

        setup(state) {
            state.listen('mouseup', () => (this.dragging = false));
            state.listen('touchend', () => (this.dragging = false));

            state.listen('touchmove', evt => {
                evt.preventDefault();
                if (!this.dragging) return;

                let dragYEnd = state.getMouseYRaw(evt);
                let mod = 1 + (this.dragStart - dragYEnd) * DRAG_COEFFICIENT;

                if (mod > 0 && mod < 2) {
                    state.zoomOnCenter(mod);
                }
                this.dragStart = dragYEnd;
            });
        },

        collider(state) {
            return new RectCollider(state.width - WIDTH, 0, WIDTH, state.height, { zIndex: 1 });
        },

        onMouseDown(_state, _time, y, isTouch) {
            if (!isTouch) return;
            this.dragStart = y;
            this.dragging = true;
        },

        contextMenu: makeStandardContextMenu(labels, canvasState)
    });
</script>

<slot />
