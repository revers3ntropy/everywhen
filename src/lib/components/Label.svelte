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
        padding: 5px;
        border-radius: @border-radius;
        display: inline-grid;
        align-items: center;
        grid-template-columns: 25px 1fr;
        background: @border;

        &:hover {
            background: @accent-secondary;
            * {
                color: black;
            }
        }

        overflow: hidden;

        .name {
            text-align: left;
            margin-left: 5px;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            max-width: 10rem;
        }

        .colour {
            height: 20px;
            width: 20px;
            border-radius: 50%;
        }
    }
</style>
