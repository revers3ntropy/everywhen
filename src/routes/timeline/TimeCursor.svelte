<script lang="ts">
    import { getNotificationsContext } from 'svelte-notifications';
    import { START_ZOOM } from '../../lib/canvas/canvasState';
    import { RectCollider } from '../../lib/canvas/collider';
    import { interactable } from '../../lib/canvas/interactable';
    import { Event } from '../../lib/controllers/event';
    import type { Auth } from '../../lib/controllers/user';
    import { api } from '../../lib/utils/apiRequest';
    import { currentTzOffset, fmtUtc, nowUtc } from '../../lib/utils/time';
    import type { TimestampSecs } from '../../lib/utils/types';
    import { displayNotifOnErr } from '../../lib/utils/notifications.js';

    export const { addNotification } = getNotificationsContext();

    const COLLIDER_ABOVE = 60;
    const COLLIDER_BELOW = 40;
    const PLUS_ICON_WIDTH = 15;
    const PLUS_ICON_OFFSET = [-15, 35] as const;
    const PLUS_ICON_PADDING = 4;
    const PLUS_ICON_WEIGHT = 2;

    export let auth: Auth;
    export let onCreateEvent: (event: Event) => void;

    async function newEvent(start: TimestampSecs, end: TimestampSecs) {
        const event = {
            name: 'New Event',
            start,
            end
        };
        const { id } = displayNotifOnErr(
            addNotification,
            await api.post(auth, '/events', event)
        );
        onCreateEvent(
            new Event(
                id,
                event.name,
                event.start,
                event.end,
                nowUtc() // not precise but fine
            )
        );
    }

    interactable({
        cursorOnHover: 'pointer',
        render(state) {
            if (!this.hovering) return;

            // center screen
            const time = state.mouseTime;

            state.text(
                fmtUtc(time, currentTzOffset(), 'ddd DD MMM YYYY'),
                state.timeToRenderPos(time),
                state.centerLnY() - 32,
                { colour: state.colours.accentPrimary }
            );
            if (state.zoom > START_ZOOM) {
                state.text(
                    fmtUtc(time, currentTzOffset(), 'hh:mma'),
                    state.timeToRenderPos(time),
                    state.centerLnY() - 44,
                    { colour: state.colours.accentPrimary }
                );
            }

            // cursor line
            state.rect(
                state.timeToRenderPos(time),
                state.centerLnY() - 20,
                1,
                40,
                {
                    colour: state.colours.accentPrimary
                }
            );

            // plus icon
            state.rect(
                state.timeToRenderPos(time) +
                    PLUS_ICON_OFFSET[0] -
                    PLUS_ICON_WIDTH * 0.5 -
                    PLUS_ICON_WEIGHT * 0.5 -
                    PLUS_ICON_PADDING,
                state.centerLnY() +
                    PLUS_ICON_OFFSET[1] -
                    PLUS_ICON_WIDTH * 0.5 -
                    PLUS_ICON_WEIGHT * 0.5 -
                    PLUS_ICON_PADDING,
                PLUS_ICON_WIDTH + PLUS_ICON_WEIGHT + PLUS_ICON_PADDING * 2 + 80,
                PLUS_ICON_WIDTH + PLUS_ICON_WEIGHT + PLUS_ICON_PADDING * 2,
                {
                    colour: state.colours.lightAccent,
                    radius: 4,
                    zIndex: 2
                }
            );
            state.rect(
                state.timeToRenderPos(time) +
                    PLUS_ICON_OFFSET[0] -
                    PLUS_ICON_WEIGHT * 0.5,
                state.centerLnY() +
                    PLUS_ICON_OFFSET[1] -
                    PLUS_ICON_WIDTH * 0.5 -
                    PLUS_ICON_WEIGHT * 0.5,
                PLUS_ICON_WEIGHT,
                PLUS_ICON_WIDTH + PLUS_ICON_WEIGHT,
                {
                    colour: state.colours.accentPrimary,
                    zIndex: 3
                }
            );
            state.rect(
                state.timeToRenderPos(time) +
                    PLUS_ICON_OFFSET[0] -
                    PLUS_ICON_WIDTH * 0.5 -
                    PLUS_ICON_WEIGHT * 0.5,
                state.centerLnY() +
                    PLUS_ICON_OFFSET[1] -
                    PLUS_ICON_WEIGHT * 0.5,
                PLUS_ICON_WIDTH + PLUS_ICON_WEIGHT,
                PLUS_ICON_WEIGHT,
                {
                    colour: state.colours.accentPrimary,
                    zIndex: 3
                }
            );
            state.text(
                'New Event',
                state.timeToRenderPos(time) + PLUS_ICON_OFFSET[0] + 16,
                state.centerLnY() + PLUS_ICON_OFFSET[1] - 7,
                {
                    colour: state.colours.accentPrimary,
                    zIndex: 3,
                    fontSize: 14
                }
            );
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

        onMouseUp(state, time) {
            void newEvent(
                time,
                state.renderPosToTime(state.timeToRenderPos(time) + 200)
            );
        }
    });
</script>

<slot />
