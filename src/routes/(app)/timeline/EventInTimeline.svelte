<script lang="ts">
    import { canvasState, type RenderProps, START_ZOOM } from '$lib/components/canvas/canvasState';
    import { DurationRectCollider } from '$lib/components/canvas/collider';
    import { interactable } from '$lib/components/canvas/interactable';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import { Event as EventController } from '$lib/controllers/event/event.client';
    import type { Auth } from '$lib/controllers/user/user';
    import Event from '$lib/components/event/Event.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import { dispatch, listen } from '$lib/dataChangeEvents';
    import { obfuscated } from '$lib/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { showPopup } from '$lib/utils/popups';
    import { limitStrLen } from '$lib/utils/text';
    import EventDragHandle from './EventDragHandle.svelte';

    export let auth: Auth;
    export let labels: Label[];

    export let id: string;
    export let start: number;
    export let end: number;
    export let name: string;
    export let label = null as Label | null;
    export let yLevel = 0;
    export let eventTextParityHeight: boolean;
    export let created: number;

    function yRenderPos(centerLineY: number): number {
        const y = isInstantEvent ? 0 : yLevel;
        return centerLineY - (y + EVENT_BASE_Y) * (HEIGHT + Y_MARGIN);
    }

    async function updateEvent(changes: {
        start?: TimestampSecs;
        end?: TimestampSecs;
    }): Promise<void> {
        displayNotifOnErr(await api.put(auth, apiPath('/events/?', id), changes));
        const event: EventController = {
            id,
            name,
            start: changes.start || start,
            end: changes.end || end,
            created,
            label: label || undefined
        };
        start = event.start || start;
        end = event.end || end;
        await dispatch.update('event', event);
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

    if (typeof start !== 'number' || typeof end !== 'number') {
        console.error(start, end);
        throw 'Missing required props';
    }

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
                showPopup(Event, {
                    auth,
                    obfuscated: false,
                    event: {
                        id,
                        start,
                        end,
                        name,
                        label,
                        created
                    },
                    labels,
                    expanded: true,
                    allowCollapseChange: false,
                    bordered: false
                });
                return;
            }

            void updateEvent({
                start: dragStart,
                end: dragEnd
            });
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
            }
        ]
    });

    listen.label.onCreate(label => {
        labels = [...labels, label];
    });
    listen.label.onUpdate(label => {
        labels = labels.map(l => (l.id === label.id ? label : l));
    });
    listen.label.onDelete(id => {
        labels = labels.filter(l => l.id !== id);
    });

    listen.event.onUpdate(e => {
        if (e.id !== id) return;
        start = e.start;
        end = e.end;
        name = e.name;
        label = e.label || null;
        created = e.created;
    });
    listen.event.onDelete(id => {
        if (id !== id) return;
        thisIsDeleted = true;
    });
</script>

{#if !isInstantEvent && !thisIsDeleted}
    <EventDragHandle
        {auth}
        {labels}
        {id}
        {start}
        {end}
        height={HEIGHT}
        getY={getYForDragHandle}
        {updateEvent}
    />
{/if}

<slot />
