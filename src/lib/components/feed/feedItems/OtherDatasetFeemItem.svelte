<script lang="ts">
    import type { Hours, Seconds } from '../../../../types';
    import FeedItemIcon from '$lib/components/feed/feedItems/FeedItemIcon.svelte';
    import TimeInFeed from '$lib/components/feed/feedItems/TimeInFeed.svelte';
    import EncryptedText from '$lib/components/ui/EncryptedText.svelte';

    export let obfuscated: boolean;
    export let values: Record<string, unknown>;
    export let timestamp: Seconds;
    export let tzOffset: Hours;
    export let datasetName: string;
    export let datasetId: string;
</script>

<FeedItemIcon type="otherDataset" />
<div class="text-sm pt-2 pb-4 flex gap-y-1 gap-4 flex-wrap">
    <TimeInFeed {timestamp} {tzOffset} />
    <div class="basis-full h-0 md:hidden"></div>
    <div class="flex items-center gap-2 px-2 md:p-0" class:obfuscated>
        <a href="/datasets/{datasetId}">
            <EncryptedText text={datasetName} />
        </a>
        {#each Object.entries(values) as [val, key] (key)}
            <span class="rounded-full bg-lightAccent px-3 py-1">
                <EncryptedText text={val} />:
                <b>{key}</b>
            </span>
        {/each}
    </div>
</div>
