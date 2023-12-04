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

    export let labels: Label[];

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
            allowCollapseChange: false,
            bordered: false
        });
    }
</script>

<div class="content">
    <button class="primary" on:click={newEvent} aria-label="New Event">
        <span class="button-label"> New Event </span>
        <Plus size="30" />
    </button>
</div>

<style lang="scss">
    @import '$lib/styles/layout';

    button {
        @extend .flex-center;

        border-radius: calc($border-radius * 2);
        aspect-ratio: 1/1;
        padding: 8px;
        margin: 0;
        transition: width 1s;

        .button-label {
            width: 0;
            display: none;
            transition: width 1s;
        }

        &:hover {
            aspect-ratio: unset;
            .button-label {
                margin: 0 0.5rem 0 0;
                display: unset;
                width: initial;
            }
        }
    }

    .content {
        position: absolute;
        bottom: calc($mobile-nav-height + 1rem);
        right: 1rem;
        z-index: 2;
    }
</style>
