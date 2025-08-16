<script lang="ts">
    import type { Hours, Seconds } from '../../../../types';
    import FeedItemIcon from '$lib/components/feed/feedItems/FeedItemIcon.svelte';
    import TimeInFeed from '$lib/components/feed/feedItems/TimeInFeed.svelte';
    import EncryptedText from '$lib/components/ui/EncryptedText.svelte';
    import { decryptDatasetRows } from '../../../../routes/(app)/datasets/[datasetId]/datasetActions.client';

    export let obfuscated: boolean;
    export let rowJson: string;
    export let timestamp: Seconds;
    export let tzOffset: Hours;
    export let datasetName: string;
    export let datasetId: string;
    export let columns: { name: string; ordering: number; jsonOrdering: number }[];

    const decryptedRowElements = decryptDatasetRows(columns, [
        { id: -1, created: -1, timestamp, rowJson, timestampTzOffset: tzOffset }
    ])[0].elements;
    const values = Object.fromEntries(
        decryptedRowElements.map((v, i): [string, string] => [
            columns.find(c => c.jsonOrdering === i)?.name || '?',
            String(v)
        ])
    );
</script>

<FeedItemIcon type="otherDataset" />
<div class="text-sm pt-2 pb-4 flex gap-y-1 gap-4 flex-wrap">
    <TimeInFeed {timestamp} {tzOffset} />
    <div class="basis-full h-0 md:hidden"></div>
    <div class="flex items-center gap-2 px-2 md:p-0" class:obfuscated>
        <a
            href="/datasets/{datasetId}"
            class="bg-vLightAccent hover:bg-lightAccent py-1 px-2 rounded-full"
        >
            <EncryptedText text={datasetName} />
        </a>
        {#each Object.entries(values) as [key, val] (key)}
            <span class="rounded-full bg-lightAccent px-3 py-1">
                <EncryptedText text={key} />:
                <b>{val}</b>
            </span>
        {/each}
    </div>
</div>
