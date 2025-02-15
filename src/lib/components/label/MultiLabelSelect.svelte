<script lang="ts">
    import { listen } from '$lib/dataChangeEvents';
    import { createEventDispatcher } from 'svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import LabelOffOutline from 'svelte-material-icons/LabelOffOutline.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import { showPopup } from '$lib/utils/popups';
    import NewLabelDialog from '$lib/components/dialogs/NewLabelDialog.svelte';
    import { tryDecryptText } from '$lib/utils/encryption.client';
    import EncryptedText from '../ui/EncryptedText.svelte';
    import Button from '../ui/button/button.svelte';

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
    <button
        on:click={() => toggleLabel('')}
        class="flex gap-2 hover:bg-vLightAccent w-full p-1"
        aria-label="toggle no label"
    >
        <span class="flex-center">
            <span
                class="entry-color"
                class:selected={value.includes('')}
                class:bg-foreground={value.includes('')}
            />
        </span>
        <span class="flex items-center w-full">
            <LabelOffOutline size="25" />
            No Label
        </span>
    </button>
    {#each Object.keys(labels).sort((a, b) => a.localeCompare(b)) as label (label)}
        {@const selected = value.includes(label)}
        <button
            on:click={() => toggleLabel(label)}
            class="flex gap-2 hover:bg-vLightAccent w-full p-1"
            aria-label="toggle label {tryDecryptText(labels[label].name)}"
        >
            <span class="flex-center">
                <span
                    class="entry-color"
                    class:selected
                    style="border: 3px solid {labels[label].color}; {selected
                        ? `background: ${labels[label].color}`
                        : ''}"
                />
            </span>
            <EncryptedText text={labels[label].name} class="ellipsis w-full text-left" />
        </button>
    {/each}
    {#if showAddButton}
        <div class="pt-2">
            <Button
                on:click={showNewLabelPopup}
                class="flex items-center justify-start w-full gap-2"
                aria-label="Create new label"
            >
                <Plus size="25" />
                New Label
            </Button>
        </div>
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

        .entry-color {
            border-radius: $border-radius;
            width: 20px;
            height: 20px;
            border: 3px solid var(--label-color);

            &.selected {
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
</style>
