<script lang="ts">
    import { canvasState, START_ZOOM } from '$lib/canvas/canvasState';
    import { DurationRectCollider } from '$lib/canvas/collider';
    import { interactable } from '$lib/canvas/interactable';
    import type { Auth } from '$lib/controllers/user';
    import Event from '$lib/components/event/Event.svelte';
    import type { Event as EventController } from '$lib/controllers/event';
    import type { Label } from '$lib/controllers/label';
    import { obfuscated } from '$lib/stores';
    import { showPopup } from '$lib/utils/popups';
    import { limitStrLen } from '$lib/utils/text';

    const HEIGHT = 30;
    const LABEL_HEIGHT = 4;
    const SINGLE_EVENT_CIRCLE_RADIUS = 5;
    const Y_MARGIN = 2;
    const DURATION_TEXT_X_OFFSET = 2;
    const DURATION_TEXT_Y_OFFSET = 8;
    const EVENT_BASE_Y = 4;

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
    export let decrypted: boolean;

    export let updateEvent: (event: EventController, reload?: boolean) => void;
    export let deleteEvent: (id: string) => void;
    export let createEvent: (event: EventController) => void;

    let thisIsDeleted = false;

    if (!start || !end) throw 'Missing required props';

    $: duration = end - start;
    $: isInstantEvent = duration < 60;
    $: color = label?.color || $canvasState.colors.primary;

    function yRenderPos(centerLineY: number) {
        const y = isInstantEvent ? 0 : yLevel;
        return centerLineY - (y + EVENT_BASE_Y) * (HEIGHT + Y_MARGIN);
    }

    interactable({
        cursorOnHover: 'pointer',
        render(state) {
            if (thisIsDeleted) return;

            const x = state.timeToRenderPos(start);
            const y = yRenderPos(state.centerLnY());
            const width = duration * state.zoom;

            if (isInstantEvent) {
                if (this.hovering) {
                    state.circle(
                        x,
                        y + HEIGHT,
                        SINGLE_EVENT_CIRCLE_RADIUS + 1,
                        {
                            color: 'white'
                        }
                    );
                }
                state.circle(x, y + HEIGHT, SINGLE_EVENT_CIRCLE_RADIUS, {
                    color
                });
                const h = state.centerLnY() - (y + HEIGHT);
                state.rect(x, y + HEIGHT, 1, h, {
                    radius: 0,
                    color
                });
            } else {
                state.rect(x, y, width, HEIGHT, {
                    color: this.hovering ? '#222326' : '#252A35',
                    radius: 5
                });
                state.rect(x, y + HEIGHT - LABEL_HEIGHT, width, LABEL_HEIGHT, {
                    color
                });
            }

            let textColor = '#fff';

            if (x + width <= 0) {
                // not on screen
                return;
            }

            if ($obfuscated) return;

            if (!isInstantEvent && (width > 50 || this.hovering)) {
                state.text(
                    limitStrLen(name, 20),
                    Math.max(
                        DURATION_TEXT_X_OFFSET,
                        x + DURATION_TEXT_X_OFFSET
                    ),
                    y + DURATION_TEXT_Y_OFFSET,
                    {
                        color: textColor,
                        fontSize: 14
                    }
                );
            } else if (
                isInstantEvent &&
                (state.zoom > START_ZOOM / 2 || this.hovering)
            ) {
                state.text(
                    limitStrLen(name, 20),
                    x + 5,
                    y +
                        HEIGHT / 2 +
                        (eventTextParityHeight ? HEIGHT / 2 + 15 : -5),
                    {
                        align: 'center',
                        backgroundColor: this.hovering ? '#223' : undefined,
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
                const h =
                    state.centerLnY() -
                    (yRenderPos(state.centerLnY()) + HEIGHT);
                return new DurationRectCollider(
                    state.renderPosToTime(state.timeToRenderPos(start) - 5),
                    yRenderPos(state.centerLnY()) +
                        HEIGHT -
                        SINGLE_EVENT_CIRCLE_RADIUS,
                    10 / state.zoom,
                    h + SINGLE_EVENT_CIRCLE_RADIUS
                );
            }
            return new DurationRectCollider(
                start,
                yRenderPos(state.centerLnY()),
                duration,
                HEIGHT
            );
        },

        onMouseUp() {
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
                bordered: false,
                changeEventCount(by: number) {
                    // NOTE: doesn't recalculate the Y values when
                    // event is deleted, just stops rendering it
                    if (by === -1) {
                        thisIsDeleted = true;
                        deleteEvent(id);
                    } else if (by === 1) {
                        thisIsDeleted = false;
                        createEvent({
                            id,
                            name,
                            start,
                            end,
                            created,
                            label: label || undefined,
                            decrypted: true
                        });
                    }
                },
                onChange(newEvent: EventController) {
                    updateEvent({
                        ...newEvent,
                        id,
                        created,
                        decrypted: true
                    });
                }
            });
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
</script>

<slot />
