<script lang="ts">
    import { tooltip as useTooltip } from '@svelte-plugins/tooltips';

    export let value: number | string;
    export let beforeLabel = '';
    export let label: string;
    export let primary = false;
    export let tooltip = '';
</script>

{#if tooltip}
    <div class={primary ? 'primary' : ''} use:useTooltip={{ content: tooltip }}>
        {beforeLabel}
        <span>{value.toLocaleString()}</span>
        {label}
    </div>
{:else}
    <div class={primary ? 'primary' : ''}>
        {beforeLabel}
        <span>{value.toLocaleString()}</span>
        {label}
    </div>
{/if}

<style lang="less">
    @import '../../styles/variables';
    @import '../../styles/layout';

    div {
        background: var(--light-accent);
        padding: 0.3rem;
        border-radius: 0.5rem;
        margin: 0.5rem;
        font-size: 0.9rem;

        span {
            font-weight: bold;
            font-size: 1rem;
        }

        &.primary {
            background: var(--accent-gradient);
            color: var(--text-colour-on-gradient);
            border: 1px solid var(--border-light);
            .glow();

            span {
                color: var(--text-colour-on-gradient);
            }
        }
    }
</style>
