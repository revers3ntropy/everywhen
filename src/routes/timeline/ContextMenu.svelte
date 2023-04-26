<script lang="ts">
    import { displayNotifOnErr } from '$lib/utils/notifications.js';
    import { getNotificationsContext } from 'svelte-notifications';
    import { RectCollider } from '../../lib/canvas/collider';
    import { interactable } from '../../lib/canvas/interactable';
    import type { Auth } from '../../lib/controllers/user';
    import { Event } from '../../lib/controllers/event';
    import { api } from '../../lib/utils/apiRequest';
    import { nowUtc } from '../../lib/utils/time';
    export let auth: Auth;

    export const { addNotification } = getNotificationsContext();

    export let onCreateEvent: (event: Event) => void;

    interactable({
        collider(state) {
            return new RectCollider(0, 0, state.width, state.height, -2);
        },

        contextMenu: [
            {
                label: 'Add Event',
                async action(state, x): Promise<void> {
                    const event = {
                        name: 'New Event',
                        start: state.renderPosToTime(x),
                        end: state.renderPosToTime(x + 150)
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
            }
        ]
    });
</script>
