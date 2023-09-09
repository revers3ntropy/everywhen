<script lang="ts">
    import type { Label } from '$lib/controllers/label/label';

    export let label = null as Label | null;

    export let obfuscated = true;
</script>

{#if label}
    <a class="label" href="/labels/{label.id}">
        <span class="color" style="background: {label.color}" />
        <span class="name {obfuscated ? 'obfuscated' : ''}">
            {label.name}
        </span>
    </a>
{/if}

<style lang="scss">
    @import '$lib/styles/text';

    .label {
        padding: 0 0.5rem 0 0;
        border-radius: $border-radius;
        display: inline-grid;
        align-items: center;
        grid-template-columns: 20px 1fr;

        overflow: hidden;

        .name {
            @extend .ellipsis;
            text-align: left;
            margin-left: 2px;
            max-width: 10rem;
            font-size: 14px;
            color: var(--text-color-accent);

            &:hover {
                color: var(--primary);
            }
        }

        .color {
            margin: 1px;
            height: 18px;
            width: 18px;
            border-radius: 50%;
            border: 1px solid var(--border-color);
        }
    }
</style>
