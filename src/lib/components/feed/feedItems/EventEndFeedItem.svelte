<script lang="ts">
    import FeedItemIcon from '$lib/components/feed/feedItems/FeedItemIcon.svelte';
    import TimeInFeed from '$lib/components/feed/feedItems/TimeInFeed.svelte';
    import LabelDot from '$lib/components/label/LabelDot.svelte';
    import type { FeedItem, FeedItemTypes } from '$lib/controllers/feed/feed';
    import type { Label } from '$lib/controllers/label/label';
    import { Day } from '$lib/utils/day';
    import EncryptedText from '$lib/components/ui/EncryptedText.svelte';

    export let item: FeedItemTypes['eventEnd'];
    export let labels: Record<string, Label>;
    export let previousItem: FeedItem | null;
    export let obfuscated: boolean;

    $: label = item.labelId ? labels[item.labelId] : null;
</script>

{#if previousItem && previousItem?.type === 'event-start' && item.id.includes(previousItem?.id) && Day.timestampsAreSameDay(item.start, item.end, item.tzOffset)}
    <!-- don't show end of event if start of event is shown immediately before -->
{:else}
    <FeedItemIcon type="event-end" />
    <div class="text-sm pt-2 pb-4 flex gap-4">
        <TimeInFeed timestamp={item.end} tzOffset={item.tzOffset} />
        <div>
            <span class="text-textColorLight">end of</span>
            {#if label}
                <span class="pl-1">
                    <LabelDot color={label.color} />
                </span>
            {/if}
            <span class:obfuscated>
                <EncryptedText text={item.nameEncrypted} />
            </span>
        </div>
    </div>
{/if}
