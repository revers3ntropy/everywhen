<script lang="ts">
    import { listen } from '$lib/dataChangeEvents';
    import { createEventDispatcher } from 'svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import LabelOffOutline from 'svelte-material-icons/LabelOffOutline.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import { showPopup } from '$lib/utils/popups';
    import NewLabelDialog from '$lib/components/dialogs/NewLabelDialog.svelte';

    export let labels: Record<string, Label>;
    export let value = [] as string[];
    export let showAddButton = true;

    function showNewLabelPopup() {
        showPopup(NewLabelDialog, {});
    }

    function toggleLabel(id: string) {
        if (value.includes(id)) {
            value = value.filter(v => v !== id);
        } else {
            value = [...value, id];
        }
    }

    const dispatchEvent = createEventDispatcher();

    $: dispatchEvent('change', { ids: value });

    listen.label.onCreate(label => {
        labels[label.id] = label;
        value = [...value, label.id];
    });
    listen.label.onUpdate(label => {
        labels[label.id] = label;
    });
    listen.label.onDelete(id => {
        value = value.filter(v => v !== id);
        delete labels[id];
    });
</script>

<span class="select-label">
    <button on:click={() => toggleLabel('')} class="label-button" aria-label="Remove label">
        <span class="flex-center">
            <span
                class="entry-color"
                class:selected={value.includes('')}
                style="--label-color: var(--text-color)"
            />
        </span>
        <span
            class="flex-center"
            style="justify-content: flex-start; width: 100%; padding: 0 0.5rem"
        >
            <span class="flex-center">
                <LabelOffOutline size="25" />
            </span>
            <span class="label-name"> No Label </span>
        </span>
    </button>
    {#each Object.keys(labels).sort((a, b) => a.localeCompare(b)) as label (label)}
        <button
            on:click={() => toggleLabel(label)}
            class="label-button"
            aria-label="Select label {labels[label].name}"
        >
            <span class="flex-center">
                <span
                    class="entry-color"
                    class:selected={value.includes(label)}
                    style="--label-color: {labels[label].color}"
                />
            </span>
            <span class="ellipsis w-full text-left px-2 label-name">
                {labels[label].name}
            </span>
        </button>
    {/each}
    {#if showAddButton}
        <button on:click={showNewLabelPopup} class="label-button" aria-label="Create new label">
            <span class="flex-center">
                <Plus size="25" />
            </span>
            <span class="label-name"> New Label </span>
        </button>
    {/if}
</span>

<style lang="scss">
    @import '$lib/styles/text';

    .select-label {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 1rem 0;

        .label-button {
            padding: 4px;
            width: 100%;
            display: grid;
            grid-template-columns: auto 1fr;
            place-items: center;

            &:hover {
                background: var(--v-light-accent);
            }

            .entry-color {
                border-radius: $border-radius;
                width: 20px;
                height: 20px;
                border: 3px solid var(--label-color);

                &.selected {
                    background: var(--label-color);

                    &::after {
                        content: '\2713';
                        display: block;
                        width: 100%;
                        height: 100%;
                        color: var(--text-color-light);
                    }
                }
            }
        }
    }
</style>
