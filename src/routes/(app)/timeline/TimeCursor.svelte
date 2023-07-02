<script lang="ts">
    import { canvasState, type RenderProps, START_ZOOM } from '$lib/components/canvas/canvasState';
    import { RectCollider } from '$lib/components/canvas/collider';
    import { interactable } from '$lib/components/canvas/interactable';
    import type { Label } from '$lib/controllers/label/label';
    import type { Auth } from '$lib/controllers/user/user';
    import Event from '$lib/components/event/Event.svelte';
    import { Event as EventController } from '$lib/controllers/event/event.client';
    import { dispatch } from '$lib/dataChangeEvents';
    import { api } from '$lib/utils/apiRequest';
    import { showPopup } from '$lib/utils/popups';
    import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications.js';
    import { makeStandardContextMenu } from './standardContextMenu';

    export let auth: Auth;
    export let labels: Label[];

    async function newEvent(start: TimestampSecs, end: TimestampSecs) {
        const { id } = displayNotifOnErr(
            await api.post(auth, '/events', {
                name: EventController.NEW_EVENT_NAME,
                start,
                end
            })
        );
        const event: EventController = {
            id,
            name: EventController.NEW_EVENT_NAME,
            start,
            end,
            created: nowUtc() // not precise but fine
        };
        await dispatch.create('event', event);

        showPopup(Event, {
            auth,
            obfuscated: false,
            event,
            labels,
            expanded: true,
            allowCollapseChange: false,
            bordered: false
        });
    }

    const COLLIDER_ABOVE = 60;
    const COLLIDER_BELOW = 40;

    interactable({
        cursorOnHover: 'crosshair',
        hovering: false,
        dragging: false,
        dragStartTime: 0,

        whenDragReleased(state: RenderProps, time: TimestampSecs) {
            this.dragging = false;

            let dragStart = Math.floor(this.dragStartTime);
            let dragEnd = Math.floor(time);

            if (dragStart > dragEnd) {
                [dragStart, dragEnd] = [dragEnd, dragStart];
            }

            if (state.timeToX(dragEnd) - state.timeToX(dragStart) < (4 as Pixels)) {
                dragEnd = dragStart;
            }

            void newEvent(dragStart, dragEnd);
        },

        setup(state) {
            state.listen('mouseup', () => {
                if (!this.dragging) return;
                this.whenDragReleased(state, state.mouseTime);
            });
            state.listen('touchend', () => {
                if (!this.dragging) return;
                this.whenDragReleased(state, state.mouseTime);
            });
        },

        render(state) {
            if (this.dragging) {
                const dragEnd = state.timeToX(state.mouseTime);
                const dragStart = state.timeToX(this.dragStartTime);

                state.rect(dragStart, state.centerLnY() - 20, dragEnd - dragStart, 40, {
                    color: state.colors.lightAccent,
                    radius: 4,
                    zIndex: 2
                });
            }

            if (!this.hovering) return;

            // center screen
            const time = state.mouseTime;

            state.text(
                fmtUtc(time, currentTzOffset(), 'ddd DD MMM YYYY'),
                state.timeToX(time),
                state.centerLnY() - 32,
                { color: state.colors.accent }
            );
            if (state.zoom > START_ZOOM) {
                state.text(
                    fmtUtc(time, currentTzOffset(), 'hh:mma'),
                    state.timeToX(time),
                    state.centerLnY() - 44,
                    { color: state.colors.accent }
                );
            }

            // cursor line
            state.rect(state.timeToX(time), state.centerLnY() - 20, 1, 40, {
                color: state.colors.accent
            });
        },

        collider(state) {
            return new RectCollider(
                0,
                state.centerLnY() - COLLIDER_ABOVE,
                state.width,
                COLLIDER_ABOVE + COLLIDER_BELOW,
                { zIndex: -1 }
            );
        },

        onMouseDown(_state, time) {
            this.dragStartTime = time;
            this.dragging = true;
        },

        contextMenu: makeStandardContextMenu(auth, labels, canvasState)
    });
</script>

<slot />
