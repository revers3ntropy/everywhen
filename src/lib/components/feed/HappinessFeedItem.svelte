<script lang="ts">
    import HappinessValueIcon from '$lib/components/dataset/HappinessValueIcon.svelte';
    import TimeInFeed from '$lib/components/feed/TimeInFeed.svelte';

    export let tzOffset: number;
    export let timestamp: number;
    export let value: number;
    export let obfuscated: boolean;
</script>

<div class="text-sm py-2 flex gap-y-1 gap-4 flex-wrap">
    <TimeInFeed {timestamp} {tzOffset} />
    <HappinessValueIcon {value} />
    <div class="basis-full h-0 md:hidden"></div>
    <div class="flex-center gap-4 px-2 md:p-0" class:obfuscated>
        {value * 10}/10
    </div>
</div>
