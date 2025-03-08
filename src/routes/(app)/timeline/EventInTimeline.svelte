<script lang="ts">
    import * as Dialog from '$lib/components/ui/dialog';
    import { canvasState, type RenderProps, START_ZOOM } from '$lib/components/canvas/canvasState';
    import { DurationRectCollider } from '$lib/components/canvas/collider';
    import { interactable } from '$lib/components/canvas/interactable';
    import { notify } from '$lib/components/notifications/notifications';
    import { Event as EventController } from '$lib/controllers/event/event';
    import Event from '$lib/components/event/Event.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import { dispatch } from '$lib/dataChangeEvents';
    import { obfuscated } from '$lib/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { limitStrLen } from '$lib/utils/text';
    import type { Pixels, TimestampSecs } from '../../../types';
    import EventDragHandle from './EventDragHandle.svelte';

    export let labels: Record<string, Label>;

    export let id: string;
    export let created: number;
    export let start: number;
    export let end: number;
    export let tzOffset: number;
    export let name: string;
    export let label: Label | null;
    export let yLevel = 0;
    export let eventTextParityHeight: boolean;

    let popupOpen = false;

    function yRenderPos(centerLineY: number): number {
        const y = isInstantEvent ? 0 : yLevel;
        return centerLineY - (y + EVENT_BASE_Y) * (HEIGHT + Y_MARGIN);
    }

    async function updateEvent(
        id: string,
        changes: {
            start?: TimestampSecs;
            end?: TimestampSecs;
        }
    ): Promise<void> {
        notify.onErr(await api.put(apiPath('/events/?', id), changes));
        const oldEvent: EventController = {
            id,
            name,
            start,
            end,
            tzOffset,
            created,
            label
        };
        const event: EventController = {
            ...oldEvent,
            start: changes.start || start,
            end: changes.end || end
        };
        start = event.start || start;
        end = event.end || end;
        await dispatch.update('event', event, oldEvent);
    }

    function startEndWhenDragging(
        state: RenderProps,
        dragStartTime: TimestampSecs
    ): {
        start: TimestampSecs;
        end: TimestampSecs;
    } {
        let dragStart = Math.floor(dragStartTime);
        let dragEnd = Math.floor(state.mouseTime);
        let timeChange = dragEnd - dragStart;
        return {
            start: start + timeChange,
            end: end + timeChange
        };
    }

    function getYForDragHandle(centerLnY: number): number {
        return yRenderPos(centerLnY);
    }

    let thisIsDeleted = false;

    $: duration = end - start;
    $: isInstantEvent = duration < 60;
    $: labelColor = label?.color || $canvasState.colors.primary;

    const HEIGHT = 30;
    const LABEL_HEIGHT = 4;
    const SINGLE_EVENT_CIRCLE_RADIUS = 5;
    const Y_MARGIN = 2;
    const DURATION_TEXT_X_OFFSET = 2;
    const DURATION_TEXT_Y_OFFSET = 8;
    const EVENT_BASE_Y = 4;

    interactable({
        cursorOnHover: 'pointer',
        hovering: false,
        dragStartTime: 0,
        dragging: false,

        whenDragReleased(state: RenderProps) {
            this.dragging = false;

            const { start: dragStart, end: dragEnd } = startEndWhenDragging(
                state,
                this.dragStartTime
            );

            if (Math.abs(state.timeToX(dragStart) - state.timeToX(start)) < (4 as Pixels)) {
                // click
                popupOpen = true;
                return;
            }

            void updateEvent(id, {
                start: dragStart,
                end: dragEnd
            });
        },

        setup(state) {
            state.listen('mouseup', () => {
                if (!this.dragging) return;
                this.whenDragReleased(state);
            });
            state.listen('touchend', event => {
                if (!this.dragging) return;
                event.preventDefault();
                this.whenDragReleased(state);
            });
        },

        render(state) {
            if (thisIsDeleted) return;

            const x = state.timeToX(start);
            const y = yRenderPos(state.centerLnY());
            const width = duration * state.zoom;

            if (isInstantEvent) {
                if (this.hovering) {
                    state.circle(x, y + HEIGHT, SINGLE_EVENT_CIRCLE_RADIUS + 1, {
                        color: state.colors.text
                    });
                }
                state.circle(x, y + HEIGHT, SINGLE_EVENT_CIRCLE_RADIUS, {
                    color: labelColor
                });
                const h = state.centerLnY() - (y + HEIGHT) - SINGLE_EVENT_CIRCLE_RADIUS;
                state.rect(x - 1, y + HEIGHT + SINGLE_EVENT_CIRCLE_RADIUS, 2, h, {
                    radius: 0,
                    color: labelColor
                });

                if (this.dragging) {
                    const draggedEvent = startEndWhenDragging(state, this.dragStartTime);
                    const x = state.timeToX(draggedEvent.start);
                    state.rect(x - 1, y + HEIGHT + SINGLE_EVENT_CIRCLE_RADIUS, 2, h, {
                        color: state.colors.text,
                        radius: 5
                    });
                    state.circle(x, y + HEIGHT, SINGLE_EVENT_CIRCLE_RADIUS, {
                        color: labelColor,
                        wireframe: true
                    });
                }
            } else {
                state.rect(x, y, width, HEIGHT, {
                    color: this.hovering ? state.colors.lightAccent : state.colors.primary,
                    radius: 5
                });
                if (label) {
                    state.rect(x, y + HEIGHT - LABEL_HEIGHT, width, LABEL_HEIGHT, {
                        color: labelColor
                    });
                }
                if (this.dragging) {
                    const draggedEvent = startEndWhenDragging(state, this.dragStartTime);
                    const x = state.timeToX(draggedEvent.start);
                    const width = EventController.duration(draggedEvent) * state.zoom;
                    state.rect(x, y, width, HEIGHT, {
                        color: state.colors.text,
                        wireframe: true,
                        radius: 5
                    });
                }
            }

            if (x + width <= 0) {
                // not on screen
                return;
            }

            if ($obfuscated) return;

            if (!isInstantEvent && (width > 50 || this.hovering)) {
                state.text(
                    limitStrLen(name, 20),
                    Math.max(DURATION_TEXT_X_OFFSET, x + DURATION_TEXT_X_OFFSET),
                    y + DURATION_TEXT_Y_OFFSET,
                    {
                        fontSize: 14
                    }
                );
            } else if (isInstantEvent && (state.zoom > START_ZOOM / 2 || this.hovering)) {
                state.text(
                    limitStrLen(name, 20),
                    x + 5,
                    y + HEIGHT / 2 + (eventTextParityHeight ? HEIGHT / 2 + 15 : -5),
                    {
                        align: 'center',
                        backgroundColor: this.hovering ? state.colors.primary : undefined,
                        fontSize: this.hovering ? 14 : 12,
                        backgroundPadding: 4,
                        backgroundRadius: 2
                    }
                );
            }
        },

        collider(state) {
            if (thisIsDeleted) return null;
            if (isInstantEvent) {
                const h = state.centerLnY() - (yRenderPos(state.centerLnY()) + HEIGHT);
                return new DurationRectCollider(
                    state.xToTime(state.timeToX(start) - 5),
                    yRenderPos(state.centerLnY()) + HEIGHT - SINGLE_EVENT_CIRCLE_RADIUS,
                    10 / state.zoom,
                    h + SINGLE_EVENT_CIRCLE_RADIUS
                );
            }
            return new DurationRectCollider(start, yRenderPos(state.centerLnY()), duration, HEIGHT);
        },

        onMouseDown(_state, time) {
            if (thisIsDeleted) return;
            this.dragStartTime = time;
            this.dragging = true;
        },

        contextMenu: [
            {
                label: 'Zoom to Event',
                action(state) {
                    state.zoomTo(start, end);
                }
            },
            {
                label: 'Delete',
                async action() {
                    notify.onErr(await api.delete(apiPath('/events/?', id)));
                    await dispatch.delete('event', id);
                }
            }
        ]
    });
</script>

<Dialog.Root bind:open={popupOpen}>
    <Dialog.Content>
        <Event
            obfuscated={false}
            event={{
                id,
                start,
                end,
                tzOffset,
                name,
                label,
                created
            }}
            {labels}
        />
    </Dialog.Content>
</Dialog.Root>

{#if !isInstantEvent && !thisIsDeleted}
    <EventDragHandle {id} {start} {end} height={HEIGHT} getY={getYForDragHandle} {updateEvent} />
{/if}

<slot />
