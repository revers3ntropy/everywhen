<script lang="ts">
    import * as Dialog from '$lib/components/ui/dialog';
    import { canvasState, type RenderProps, START_ZOOM } from '$lib/components/canvas/canvasState';
    import { RectCollider } from '$lib/components/canvas/collider';
    import { interactable } from '$lib/components/canvas/interactable';
    import type { Label } from '$lib/controllers/label/label';
    import Event from '$lib/components/event/Event.svelte';
    import { Event as EventController } from '$lib/controllers/event/event';
    import { dispatch } from '$lib/dataChangeEvents';
    import { api } from '$lib/utils/apiRequest';
    import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
    import { notify } from '$lib/components/notifications/notifications';
    import type { Pixels, TimestampSecs } from '../../../types';
    import { makeStandardContextMenu } from './standardContextMenu';
    import { CSLogger } from '$lib/controllers/logs/logger.client';
    import { tryEncryptText } from '$lib/utils/encryption.client';

    export let labels: Record<string, Label>;

    let eventInDialog: EventController | null = null;

    async function newEvent(start: TimestampSecs, end: TimestampSecs) {
        const name = tryEncryptText(EventController.NEW_EVENT_NAME);
        const { id } = notify.onErr(
            await api.post('/events', {
                name,
                start,
                end,
                tzOffset: currentTzOffset()
            })
        );
        const event = {
            id,
            name,
            start,
            end,
            tzOffset: currentTzOffset(),
            created: nowUtc(), // not precise but fine
            labelId: null
        } satisfies EventController;
        await dispatch.create('event', event);
        eventInDialog = event;
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

            let dragStart: TimestampSecs = Math.floor(this.dragStartTime);
            let dragEnd: TimestampSecs = Math.floor(time);

            if (dragStart > dragEnd) {
                [dragStart, dragEnd] = [dragEnd, dragStart];
            }

            if (state.timeToX(dragEnd) - state.timeToX(dragStart) < (4 as Pixels)) {
                dragEnd = dragStart;
            }

            void newEvent(dragStart, dragEnd);
        },

        setup(state) {
            state.listen('mouseup', event => {
                if (!this.dragging) return;
                this.whenDragReleased(state, state.mouseTime);
                event.preventDefault();
            });
            state.listen('touchend', event => {
                if (!this.dragging) return;
                this.whenDragReleased(state, state.mouseTime);
                event.preventDefault();
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

        contextMenu: makeStandardContextMenu(canvasState)
    });
</script>

<Dialog.Root
    open={!!eventInDialog}
    onOpenChange={open => {
        if (!open) {
            eventInDialog = null;
        } else {
            void CSLogger.error('open', { open, eventInDialog });
            notify.error('Something went wrong');
        }
    }}
>
    <Dialog.Content>
        <div class="pr-4">
            {#if eventInDialog}
                <Event event={eventInDialog} {labels} obfuscated={false} />
            {:else}
                Something went wrong
            {/if}
        </div>
    </Dialog.Content>
</Dialog.Root>

<slot />
