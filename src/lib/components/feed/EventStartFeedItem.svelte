<script lang="ts">
    import FeedItemIcon from '$lib/components/feed/FeedItemIcon.svelte';
    import TimeInFeed from '$lib/components/feed/TimeInFeed.svelte';
    import LabelDot from '$lib/components/label/LabelDot.svelte';
    import { Auth } from '$lib/controllers/auth/auth';
    import { Event } from '$lib/controllers/event/event';
    import type { FeedItem, FeedItemTypes } from '$lib/controllers/feed/feed';
    import type { Label } from '$lib/controllers/label/label';
    import { encryptionKey } from '$lib/stores';
    import { Day } from '$lib/utils/day';

    export let item: FeedItemTypes['eventStart'];
    export let labels: Record<string, Label>;
    export let nextItem: FeedItem | null;
    export let obfuscated: boolean;

    $: label = item.labelId ? labels[item.labelId] : null;
    $: name = Auth.decryptOrLogOut(item.nameEncrypted, $encryptionKey);
</script>

<!-- if the event starts and then immediately ends, collapse into one item -->
{#if nextItem?.type === 'event-end' && nextItem?.id === `${item.id}-end` && Day.timestampsAreSameDay(item.start, item.end, item.tzOffset) && !Event.isInstantEvent(item)}
    <FeedItemIcon type="event" />
    <div class="text-sm pt-2 pb-4 flex gap-4">
        <TimeInFeed timestamp={item.start} to={item.end} tzOffset={item.tzOffset} />
        <div class:obfuscated>
            {#if label}
                <LabelDot color={label.color} />
            {/if}
            {name}
        </div>
    </div>
{:else}
    <FeedItemIcon type={!Event.isInstantEvent(item) ? 'event-start' : 'event'} />
    <div class="text-sm pt-2 pb-4 flex gap-4">
        <TimeInFeed timestamp={item.start} tzOffset={item.tzOffset} />
        <div>
            {#if !Event.isInstantEvent(item)}
                <span class="text-textColorLight"> start of </span>
            {/if}
            {#if label}
                <span class="pl-1">
                    <LabelDot color={label.color} />
                </span>
            {/if}
            <span class:obfuscated>
                {name}
            </span>
        </div>
    </div>
{/if}
