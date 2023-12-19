<script lang="ts">
    import TimeInFeed from '$lib/components/feed/TimeInFeed.svelte';
    import LabelDot from '$lib/components/label/LabelDot.svelte';
    import { Auth } from '$lib/controllers/auth/auth';
    import type { FeedItem, FeedItemTypes } from '$lib/controllers/feed/feed';
    import type { Label } from '$lib/controllers/label/label';
    import { encryptionKey } from '$lib/stores';
    import { Day } from '$lib/utils/time';
    import CalendarEnd from 'svelte-material-icons/CalendarEnd.svelte';

    export let item: FeedItemTypes['eventEnd'];
    export let labels: Record<string, Label>;
    export let previousItem: FeedItem | null;
    export let obfuscated: boolean;

    $: label = item.labelId ? labels[item.labelId] : null;
</script>

{#if previousItem && previousItem?.type === 'event-start' && item.id.includes(previousItem?.id) && Day.timestampsAreSameDay(item.start, item.end, item.tzOffset)}
    <!-- don't show end of event if start of event is shown immediately before -->
{:else}
    <div class="text-sm py-2 flex gap-4">
        <TimeInFeed timestamp={item.end} tzOffset={item.tzOffset} />
        <CalendarEnd size="22" />
        <div class="pb-2">
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
