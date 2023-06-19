<script lang="ts">
    import { START_ZOOM } from '$lib/canvas/canvasState';
    import { RectCollider } from '$lib/canvas/collider';
    import { interactable } from '$lib/canvas/interactable';
    import { Event } from '$lib/controllers/event';
    import type { Auth } from '$lib/controllers/user';
    import { dispatch } from '$lib/dataChangeEvents';
    import { api } from '$lib/utils/apiRequest';
    import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
    import { displayNotifOnErr } from '$lib/notifications/notifications.js';
    import type { TimestampSecs } from '../../app';

    const COLLIDER_ABOVE = 60;
    const COLLIDER_BELOW = 40;

    export let auth: Auth;

    async function newEvent(start: TimestampSecs, end: TimestampSecs) {
        const event = {
            name: 'New Event',
            start,
            end
        };
        const { id } = displayNotifOnErr(
            await api.post(auth, '/events', event)
        );
        await dispatch.create(
            'event',
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
        cursorOnHover: 'crosshair',
        render(state) {
            if (!this.hovering) return;

            // center screen
            const time = state.mouseTime;

            state.text(
                fmtUtc(time, currentTzOffset(), 'ddd DD MMM YYYY'),
                state.timeToRenderPos(time),
                state.centerLnY() - 32,
                { color: state.colors.accent }
            );
            if (state.zoom > START_ZOOM) {
                state.text(
                    fmtUtc(time, currentTzOffset(), 'hh:mma'),
                    state.timeToRenderPos(time),
                    state.centerLnY() - 44,
                    { color: state.colors.accent }
                );
            }

            // cursor line
            state.rect(
                state.timeToRenderPos(time),
                state.centerLnY() - 20,
                1,
                40,
                {
                    color: state.colors.accent
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
            if (!confirm('Create new event?')) return;
            void newEvent(
                Math.floor(time),
                state.renderPosToTime(
                    state.timeToRenderPos(Math.floor(time)) + 200
                )
            );
        }
    });
</script>

<slot />
