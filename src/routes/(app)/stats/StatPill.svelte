<script lang="ts">
    import { tooltip as useTooltip } from '@svelte-plugins/tooltips';

    export let value: number | string;
    export let beforeLabel = '';
    export let label: string;
    export let tooltip = '';
</script>

{#if tooltip}
    <div use:useTooltip={{ content: tooltip }}>
        {beforeLabel}
        <span class="font-bold">{value.toLocaleString()}</span>
        {label}
    </div>
{:else}
    <div>
        {beforeLabel}
        <span class="font-bold">{value.toLocaleString()}</span>
        {label}
    </div>
{/if}
