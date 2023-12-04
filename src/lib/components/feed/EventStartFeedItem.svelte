<script lang="ts">
    import LabelDot from '$lib/components/label/LabelDot.svelte';
    import UtcTime from '$lib/components/UtcTime.svelte';
    import type { FeedItem } from '$lib/controllers/feed/feed';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import CalendarStart from 'svelte-material-icons/CalendarStart.svelte';
    import { Event } from '$lib/controllers/event/event';

    export let item: Event;
    export let nextItem: FeedItem | null;
    export let obfuscated: boolean;
</script>

<!-- if the event starts and then immediately ends, collapse into one item -->
{#if nextItem?.type === 'event-end' && nextItem?.id === `${item.id}-end`}
    <div class="text-sm p-2 flex gap-4">
        <div class="flex gap-3 pb-2">
            <span class="text-textColorLight">
                <UtcTime timestamp={item.start} tzOffset={item.tzOffset} fmt="h:mma" />
                {#if !Event.isInstantEvent(item)}
                    -
                    <UtcTime timestamp={item.end} tzOffset={item.tzOffset} fmt="h:mma" />
                {/if}
            </span>
            <Calendar size="22" />
        </div>
        <div class:obfuscated>
            {#if item.label}
                <LabelDot color={item.label.color} name={item.label.name} />
            {/if}
            {item.name}
        </div>
    </div>
{:else}
    <div class="text-sm p-2 flex gap-4">
        <div class="flex gap-3 text-textColorLight pb-2">
            <UtcTime timestamp={item.start} tzOffset={item.tzOffset} fmt="h:mma" />
            <CalendarStart size="22" />
        </div>
        <div>
            <span class="text-textColorLight">start of</span>
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
