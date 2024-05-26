<script lang="ts">
    import FeedItemIcon from '$lib/components/feed/FeedItemIcon.svelte';
    import TimeInFeed from '$lib/components/feed/TimeInFeed.svelte';
    import LabelDot from '$lib/components/label/LabelDot.svelte';
    import { Auth } from '$lib/controllers/auth/auth';
    import type { FeedItem, FeedItemTypes } from '$lib/controllers/feed/feed';
    import type { Label } from '$lib/controllers/label/label';
    import { encryptionKey } from '$lib/stores';
    import { Day } from '$lib/utils/day';

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
                    <LabelDot color={label.color} name={label.name} />
                </span>
            {/if}
            <span class:obfuscated>
                {Auth.decryptOrLogOut(item.nameEncrypted, $encryptionKey)}
            </span>
        </div>
    </div>
{/if}
