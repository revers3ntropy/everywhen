import type { ContextMenuOptions } from '$lib/components/canvas/canvasState';
import Event from '$lib/components/event/Event.svelte';
import { displayNotifOnErr } from '$lib/components/notifications/notifications';
import { Event as EventController } from '$lib/controllers/event/event.client';
import type { Label } from '$lib/controllers/label/label.client';
import type { Auth } from '$lib/controllers/user/user';
import { dispatch } from '$lib/dataChangeEvents';
import { api } from '$lib/utils/apiRequest';
import { showPopup } from '$lib/utils/popups';
import { nowUtc } from '$lib/utils/time';
import type { CanvasState } from '$lib/components/canvas/canvasState';
import type { Writable } from 'svelte/store';

export function makeStandardContextMenu(
    auth: Auth,
    labels: Label[],
    canvasState: Writable<CanvasState>
): ContextMenuOptions {
    let state: CanvasState;
    canvasState.subscribe(s => (state = s));

    async function newEvent(start: TimestampSecs, end: TimestampSecs) {
        const { id } = displayNotifOnErr(
            await api.post(auth, '/events', {
                name: EventController.NEW_EVENT_NAME,
                start,
                end
            })
        );
        const event: EventController = {
            id,
            name: EventController.NEW_EVENT_NAME,
            start,
            end,
            created: nowUtc() // not precise but fine
        };
        await dispatch.create('event', event);

        showPopup(Event, {
            auth,
            obfuscated: false,
            event,
            labels,
            expanded: true,
            allowCollapseChange: false,
            bordered: false
        });
    }

    function resetCamera() {
        state.zoom = 0.01;
        state.cameraOffset = state.cameraOffsetForTime();
    }

    return [
        {
            label: 'Add Event',
            async action(state, x): Promise<void> {
                await newEvent(state.xToTime(x), state.xToTime(x + 200));
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
    ];
}
