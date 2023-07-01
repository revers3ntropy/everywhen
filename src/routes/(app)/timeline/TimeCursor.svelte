<script lang="ts">
    import { START_ZOOM } from '$lib/components/canvas/canvasState';
    import { RectCollider } from '$lib/components/canvas/collider';
    import { interactable } from '$lib/components/canvas/interactable';
    import type { Auth } from '$lib/controllers/user/user';
    import { dispatch } from '$lib/dataChangeEvents';
    import { api } from '$lib/utils/apiRequest';
    import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications.js';

    export let auth: Auth;

    async function newEvent(start: TimestampSecs, end: TimestampSecs) {
        const event = {
            name: 'New Event',
            start,
            end
        };
        const { id } = displayNotifOnErr(await api.post(auth, '/events', event));
        await dispatch.create('event', {
            id,
            name: event.name,
            start: event.start,
            end: event.end,
            created: nowUtc() // not precise but fine
        });
    }

    const COLLIDER_ABOVE = 60;
    const COLLIDER_BELOW = 40;

    interactable({
        cursorOnHover: 'crosshair',
        hovering: false,
        render(state) {
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

        onMouseUp(state, time) {
            if (!confirm('Create new event?')) return;
            void newEvent(Math.floor(time), state.xToTime(state.timeToX(Math.floor(time)) + 200));
        }
    });
</script>

<slot />
