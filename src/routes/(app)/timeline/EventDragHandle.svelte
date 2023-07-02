<script lang="ts">
    import type { RenderProps } from '$lib/components/canvas/canvasState';
    import { RectCollider } from '$lib/components/canvas/collider';
    import { interactable } from '$lib/components/canvas/interactable';
    import { Event as EventController } from '$lib/controllers/event/event.client';
    import type { Label } from '$lib/controllers/label/label';
    import type { Auth } from '$lib/controllers/user/user';

    const WIDTH = 8;

    export let auth: Auth;
    export let labels: Label[];

    export let id: string;
    export let start: number;
    export let end: number;
    export let getY: (centerLineY: number) => number;
    export let height: number;
    export let updateEvent: (changes: {
        start?: TimestampSecs;
        end?: TimestampSecs;
    }) => Promise<void>;

    function shouldShow(start: number, end: number, zoom: number) {
        return EventController.duration({ start, end }) * zoom > WIDTH * 2;
    }

    interactable({
        dragging: false,
        hovering: false,
        draggingStart: 0,
        cursorOnHover: 'ew-resize',

        whenDragReleased(state: RenderProps) {
            this.dragging = false;
            const newEnd = Math.floor(state.mouseTime);
            void updateEvent({ end: newEnd });
        },

        setup(state) {
            state.listen('mouseup', () => {
                if (!this.dragging) return;
                this.whenDragReleased(state);
            });
            state.listen('touchend', () => {
                if (!this.dragging) return;
                this.whenDragReleased(state);
            });
        },

        collider(state) {
            if (!shouldShow(start, end, state.zoom)) return null;
            const y = getY(state.centerLnY());
            return new RectCollider(state.timeToX(end) - WIDTH, y, WIDTH, height, {
                zIndex: 1
            });
        },

        render(state) {
            if (!shouldShow(start, end, state.zoom)) return;

            const color = this.hovering ? state.colors.text : state.colors.vLightAccent;
            const x = state.timeToX(end) - 4;
            const eventY = getY(state.centerLnY());
            state.circle(x, eventY + 4, 2, {
                color
            });
            state.circle(x, eventY + 12, 2, {
                color
            });
            state.circle(x, eventY + 20, 2, {
                color
            });

            if (this.dragging) {
                const x = state.timeToX(start);
                const width =
                    EventController.duration({
                        start,
                        end: state.mouseTime
                    }) * state.zoom;
                state.rect(x, eventY, Math.max(0, width), height, {
                    color: state.colors.text,
                    wireframe: true,
                    radius: 5
                });
            }
        },

        onMouseDown(state, time) {
            if (!shouldShow(start, end, state.zoom)) return;

            this.draggingStart = state.timeToX(time);
            this.dragging = true;
        }
    });
</script>
