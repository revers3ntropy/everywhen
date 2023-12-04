<script lang="ts">
    import LabelDot from '$lib/components/label/LabelDot.svelte';
    import UtcTime from '$lib/components/UtcTime.svelte';
    import type { FeedItem } from '$lib/controllers/feed/feed';
    import CalendarEnd from 'svelte-material-icons/CalendarEnd.svelte';
    import type { Event } from '$lib/controllers/event/event';

    export let item: Event;
    export let previousItem: FeedItem | null;
    export let obfuscated: boolean;
</script>

{#if previousItem && previousItem?.type === 'event-start' && item.id.includes(previousItem?.id)}
    <!-- don't show end of event if start of event is shown immediately before -->
{:else}
    <div class="text-sm p-2 flex gap-4">
        <div class="flex gap-3 text-textColorLight pb-2">
            <UtcTime timestamp={item.end} fmt="h:mma" />
            <CalendarEnd size="22" />
        </div>
        <div>
            <span class="text-textColorLight">end of</span>
            {#if item.label}
                <span class="pl-1">
                    <LabelDot color={item.label.color} name={item.label.name} />
                </span>
            {/if}
            <span class:obfuscated>
                {item.name}
            </span>
        </div>
    </div>
{/if}
