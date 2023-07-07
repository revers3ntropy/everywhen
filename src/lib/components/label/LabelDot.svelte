<script lang="ts">
    import { tooltip } from '@svelte-plugins/tooltips';

    export let color = null as null | string;
    export let big = false;
    export let name = null as null | string;
</script>

{#if name}
    <span
        style="--color: {color}; --border: {color === null ? 'transparent' : 'var(--border-color)'}"
        class:big
        use:tooltip={{ content: name }}
    />
{:else}
    <span
        style="--color: {color}; --border: {color === null ? 'transparent' : 'var(--border-color)'}"
        class:big
    />
{/if}

<style lang="less">
    span {
        background: var(--color);
        border: 1px solid var(--border);
        display: inline-block;
        height: 10px;
        width: 10px;
        border-radius: 50%;

        &.big {
            height: 20px;
            width: 20px;
        }
    }
</style>
