<script lang="ts">
    import { canvasState } from '$lib/components/canvas/canvasState';
    import Event from '$lib/components/event/Event.svelte';
    import { notify } from '$lib/components/notifications/notifications';
    import { Event as EventController } from '$lib/controllers/event/event';
    import type { Label } from '$lib/controllers/label/label';
    import { dispatch } from '$lib/dataChangeEvents';
    import { api } from '$lib/utils/apiRequest';
    import { showPopup } from '$lib/utils/popups';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import Plus from 'svelte-material-icons/Plus.svelte';

    export let labels: Record<string, Label>;

    async function newEvent() {
        const start = nowUtc(true);
        const end = nowUtc(true) + 60 * 60;

        const zoomMargin = 15 * 60;
        $canvasState.zoomTo(start - zoomMargin, end + zoomMargin);

        const { id } = notify.onErr(
            await api.post('/events', {
                name: EventController.NEW_EVENT_NAME,
                start,
                end,
                tzOffset: currentTzOffset()
            })
        );
        const event: EventController = {
            id,
            name: EventController.NEW_EVENT_NAME,
            start,
            end,
            tzOffset: currentTzOffset(),
            created: nowUtc(), // not precise but fine
            label: null
        };
        await dispatch.create('event', event);

        showPopup(Event, {
            obfuscated: false,
            event,
            labels,
            expanded: true,
            allowCollapseChange: false
        });
    }
</script>

<div class="content absolute right-4" style="z-index: 20">
    <button
        class="grad-bg flex-center gap-2 aspect-square p-2 rounded-full hover:aspect-auto group"
        on:click={newEvent}
        aria-label="New Event"
    >
        <span class="hidden group-hover:inline"> New Event </span>
        <Plus size="30" />
    </button>
</div>

<style lang="scss">
    @import '$lib/styles/layout';

    .content {
        bottom: calc($mobile-nav-height + 1rem);
    }
</style>
