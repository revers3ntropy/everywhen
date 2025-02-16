<script lang="ts">
    import NewEventForm from '$lib/components/event/NewEventForm.svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import * as Popover from '$lib/components/ui/popover';
    import { canvasState } from '$lib/components/canvas/canvasState';
    import type { Event } from '$lib/controllers/event/event';
    import type { Label } from '$lib/controllers/label/label';

    export let labels: Record<string, Label>;

    let open = false;

    async function onNewEvent(event: Event) {
        const zoomMargin = 15 * 60;
        $canvasState.zoomTo(event.start - zoomMargin, event.end + zoomMargin);
        open = false;
    }
</script>

<div class="content absolute right-4 z-20">
    <Popover.Root bind:open>
        <Popover.Trigger
            class="grad-bg flex-center gap-2 aspect-square p-2 rounded-full hover:aspect-auto group"
            aria-label="New Event"
        >
            <span class="hidden group-hover:inline"> New Event </span>
            <Plus size="30" />
        </Popover.Trigger>
        <Popover.Content>
            <NewEventForm {labels} onSubmit={onNewEvent} />
        </Popover.Content>
    </Popover.Root>
</div>

<style lang="scss">
    @import '$lib/styles/layout';

    .content {
        bottom: calc($mobile-nav-height + 1rem);
    }
</style>
