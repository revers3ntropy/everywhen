import type { ContextMenuOptions, CanvasState } from '$lib/components/canvas/canvasState';
import EventComponent from '$lib/components/event/Event.svelte';
import { notify } from '$lib/components/notifications/notifications';
import { Event } from '$lib/controllers/event/event';
import type { Label } from '$lib/controllers/label/label';
import { dispatch } from '$lib/dataChangeEvents';
import { api } from '$lib/utils/apiRequest';
import { currentTzOffset, nowUtc } from '$lib/utils/time';
import type { Writable } from 'svelte/store';
import type { TimestampSecs } from '../../../types';

export function makeStandardContextMenu(
    labels: Record<string, Label>,
    canvasState: Writable<CanvasState>
): ContextMenuOptions {
    let state: CanvasState;
    canvasState.subscribe(s => (state = s));

    async function newEvent(start: TimestampSecs, end: TimestampSecs) {
        const { id } = notify.onErr(
            await api.post('/events', {
                name: Event.NEW_EVENT_NAME,
                start,
                end,
                tzOffset: currentTzOffset()
            })
        );
        const event: Event = {
            id,
            name: Event.NEW_EVENT_NAME,
            start,
            end,
            tzOffset: currentTzOffset(),
            created: nowUtc(), // not precise but fine,
            label: null
        };
        await dispatch.create('event', event);

        showPopup(EventComponent, {
            obfuscated: false,
            event,
            labels,
            expanded: true,
            allowCollapseChange: false
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
