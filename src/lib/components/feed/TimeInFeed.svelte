<script lang="ts">
    import UtcTime from '$lib/components/ui/UtcTime.svelte';

    export let timestamp: number;
    export let tzOffset: number;
    export let to: number | null = null;
</script>

<div>
    <div class="relative">
        <span
            class="text-textColorLight text-sm px-2 border-borderColor border-solid border rounded-lg absolute md:-left-4 top-0 bg-backgroundColor flex-center gap-1 shadow"
        >
            <UtcTime fmt={'h:mma'} {timestamp} tooltipPosition="right" {tzOffset} />
            {#if to}
                <span>-</span>
                <UtcTime fmt={'h:mma'} timestamp={to} tooltipPosition="right" {tzOffset} />
            {/if}
        </span>
    </div>
    <div class={to === null ? 'w-16 md:w-12' : 'w-[125px]'}></div>
</div>
