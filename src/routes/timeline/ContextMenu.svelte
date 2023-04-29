<script lang="ts">
    import { canvasState } from '$lib/canvas/canvasState';
    import { displayNotifOnErr } from '$lib/utils/notifications.js';
    import { getNotificationsContext } from 'svelte-notifications';
    import { RectCollider } from '$lib/canvas/collider';
    import { interactable } from '$lib/canvas/interactable';
    import type { Auth } from '$lib/controllers/user';
    import { Event } from '$lib/controllers/event';
    import { api } from '$lib/utils/apiRequest';
    import { nowUtc } from '$lib/utils/time';
    import type { TimestampSecs } from '$lib/utils/types';
    import { cameraOffsetForNow, getInitialZoomAndPos } from './utils';
    export let auth: Auth;

    export const { addNotification } = getNotificationsContext();

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

    function resetCamera() {
        $canvasState.zoom = 0.01;
        $canvasState.cameraOffset = cameraOffsetForNow($canvasState);
    }

    interactable({
        collider(state) {
            return new RectCollider(0, 0, state.width, state.height, {
                zIndex: -3
            });
        },

        contextMenu: [
            {
                label: 'Add Event',
                async action(state, x): Promise<void> {
                    await newEvent(
                        state.renderPosToTime(x),
                        state.renderPosToTime(x + 200)
                    );
                }
            },
            {
                label: 'Zoom In',
                action(state) {
                    state.zoomOnCenter(2);
                }
            },
            {
                label: 'Zoom Out',
                action(state) {
                    state.zoomOnCenter(0.5);
                }
            },
            {
                label: 'Reset Zoom',
                action: resetCamera
            }
        ]
    });
</script>
