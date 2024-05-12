<script lang="ts">
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
<div class="text-sm py-2 flex gap-y-1 gap-4 flex-wrap">
    <TimeInFeed {timestamp} {tzOffset} />
    <HappinessValueIcon {value} />
    {#if $settingsStore.happinessInputStyle.value === 'scale'}
        <div class="flex-center gap-4 px-2 md:p-0" class:obfuscated>
            <span class="font-bold">{value * 10}</span>
        </div>
    {/if}
</div>
