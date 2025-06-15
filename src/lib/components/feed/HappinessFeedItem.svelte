<script lang="ts">
    import EmoticonOutline from 'svelte-material-icons/EmoticonOutline.svelte';
    import HappinessValueIcon from '$lib/components/dataset/HappinessValueIcon.svelte';
    import FeedItemIcon from '$lib/components/feed/FeedItemIcon.svelte';
    import TimeInFeed from '$lib/components/feed/TimeInFeed.svelte';
    import { settingsStore } from '$lib/stores';

    export let tzOffset: number;
    export let timestamp: number;
    export let value: number;
    export let obfuscated: boolean;
</script>

<FeedItemIcon type="happiness" />
<div class="text-sm pt-2 pb-4 flex gap-y-1 gap-4 flex-wrap">
    <TimeInFeed {timestamp} {tzOffset} />
    {#if obfuscated}
        <EmoticonOutline size={24} />
    {:else}
        <HappinessValueIcon {value} />
    {/if}
    {#if $settingsStore.happinessInputStyle.value === 'scale'}
        <div class="flex-center gap-4 px-2 md:p-0" class:obfuscated>
            <span class="font-bold">{value * 10}</span>
        </div>
    {/if}
</div>
