<script lang="ts">
    import UtcTime from '$lib/components/ui/UtcTime.svelte';

    export let timestamp: number;
    export let tzOffset: number;
    export let to: number | null = null;
</script>

<span class="text-textColorLight text-sm flex items-center justify-center gap-1 pl-8 md:pl-6 md:m-0">
    <UtcTime fmt={'h:mma'} {timestamp} {tzOffset} />
    {#if to}
        <span>-</span>
        <UtcTime fmt={'h:mma'} timestamp={to} {tzOffset} />
    {/if}
</span>
