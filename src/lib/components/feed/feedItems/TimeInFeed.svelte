<script lang="ts">
    import UtcTime from '$lib/components/ui/UtcTime.svelte';
    import { cn } from '$lib/utils';

    export let timestamp: number;
    export let tzOffset: number;
    export let to: number | null = null;

    let className = '';
    export { className as class };
</script>

<span
    class={cn(
        'text-textColorLight text-sm flex items-center justify-center gap-1 pl-8 md:pl-6 md:m-0',
        className
    )}
>
    <UtcTime fmt={'h:mma'} {timestamp} {tzOffset} />
    {#if to}
        <span>-</span>
        <UtcTime fmt={'h:mma'} timestamp={to} {tzOffset} />
    {/if}
</span>
