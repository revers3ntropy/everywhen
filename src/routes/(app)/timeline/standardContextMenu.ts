import type { ContextMenuOptions } from '$lib/components/canvas/canvasState';
import { displayNotifOnErr } from '$lib/components/notifications/notifications';
import type { Auth } from '$lib/controllers/user';
import { dispatch } from '$lib/dataChangeEvents';
import { api } from '$lib/utils/apiRequest';
import { nowUtc } from '$lib/utils/time';
import type { CanvasState } from '$lib/components/canvas/canvasState';
import type { Writable } from 'svelte/store';

export function makeStandardContextMenu(
    auth: Auth,
    canvasState: Writable<CanvasState>
): ContextMenuOptions {
    let state: CanvasState;
    canvasState.subscribe(s => (state = s));

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
