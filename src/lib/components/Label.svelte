<script lang="ts">
    import type { Label } from '../controllers/label';

    export let label: Label | null = null;

    export let obfuscated = true;
</script>

{#if label}
    <a class="label" href="/labels/{label.id}">
        <span class="colour" style="background: {label.colour}" />
        <span class="name {obfuscated ? 'obfuscated' : ''}">
            {label.name}
        </span>
    </a>
{:else}
    <span style="margin: 0 .5em" />
{/if}

<style lang="less">
    @import '../../styles/variables';

    .label {
        margin: 0.1em 0.4rem;
        padding: 0 0.5rem 0 0;
        border-radius: @border-radius;
        display: inline-grid;
        align-items: center;
        grid-template-columns: 20px 1fr;

        overflow: hidden;

        .name {
            text-align: left;
            margin-left: 2px;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            max-width: 10rem;
            font-size: 14px;
            color: @accent-primary;

            &:hover {
                color: @accent-secondary;
            }
        }

        .colour {
            margin: 1px;
            height: 18px;
            width: 18px;
            border-radius: 50%;
            border: 1px solid @border;
        }
    }
</style>
