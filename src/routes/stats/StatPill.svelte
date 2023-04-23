<script lang="ts">
    import { tooltip as useTooltip } from '@svelte-plugins/tooltips';

    export let value: number | string;
    export let beforeLabel = '';
    export let label: string;
    export let primary = false;
    export let tooltip = '';
</script>

{#if tooltip}
    <div
        class="{primary ? 'primary' : ''}"
        use:useTooltip={{ content: tooltip }}
    >
        {beforeLabel}
        <span>{value}</span>
        {label}
    </div>
{:else}
    <div class="{primary ? 'primary' : ''}">
        {beforeLabel}
        <span>{value}</span>
        {label}
    </div>
{/if}

<style lang="less">
    @import '../../styles/variables';
    @import '../../styles/layout';

    div {
        background: @light-accent;
        padding: 0.3rem;
        border-radius: 0.5rem;
        margin: 0.5rem;
        font-size: 0.90rem;

        span {
            font-weight: bold;
            font-size: 1rem;
        }

        &.primary {
            background: @accent-gradient;
            color: @text-color-invert;
            border: 1px solid @border-light;
            .glow();

            span {
                color: @text-color-invert;
            }
        }
    }
</style>