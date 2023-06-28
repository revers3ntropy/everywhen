<script lang="ts">
    import { canvasState } from '$lib/components/canvas/canvasState';
    import { dispatch } from '$lib/dataChangeEvents';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications.js';
    import { RectCollider } from '$lib/components/canvas/collider';
    import { interactable } from '$lib/components/canvas/interactable';
    import type { Auth } from '$lib/controllers/user';
    import { Event } from '$lib/controllers/event';
    import { api } from '$lib/utils/apiRequest';
    import { nowUtc } from '$lib/utils/time';
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

    function resetCamera() {
        $canvasState.zoom = 0.01;
        $canvasState.cameraOffset = $canvasState.cameraOffsetForTime();
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
