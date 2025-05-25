<script lang="ts">
    import LabelDot from '$lib/components/label/LabelDot.svelte';
    import * as Popover from '$lib/components/ui/popover';
    import NewLabelForm from '$lib/components/label/NewLabelForm.svelte';
    import { Switch } from '$lib/components/ui/switch';
    import { listen } from '$lib/dataChangeEvents';
    import { createEventDispatcher } from 'svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import LabelOffOutline from 'svelte-material-icons/LabelOffOutline.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import { tryDecryptText } from '$lib/utils/encryption.client';
    import EncryptedText from '../ui/EncryptedText.svelte';

    export let labels: Record<string, Label>;
    export let value = [] as string[];
    export let showAddButton = true;

    let createNewOpen = false;

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

    function toggleLabel(id: string) {
        if (value.includes(id)) {
            value = value.filter(v => v !== id);
        } else {
            value = [...value, id];
        }
    }
</script>

<span class="select-label">
    <button
        on:click={() => toggleLabel('')}
        class="w-full flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-vLightAccent"
        aria-label="toggle no label"
    >
        <Switch checked={value.includes('')} />
        <span>
            <LabelOffOutline size="25" />
            No Label
        </span>
    </button>
    {#each Object.keys(labels).sort((a, b) => a.localeCompare(b)) as label (label)}
        {@const selected = value.includes(label)}
        <button
            on:click={() => toggleLabel(label)}
            class="w-full flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-vLightAccent"
            aria-label="toggle label {tryDecryptText(labels[label].name)}"
        >
            <Switch checked={selected} />
            <span class="w-fit">
                <LabelDot color={labels[label].color} big />
            </span>
            <EncryptedText text={labels[label].name} class="ellipsis w-full text-left" />
        </button>
    {/each}
    {#if showAddButton}
        <Popover.Root bind:open={createNewOpen}>
            <Popover.Trigger aria-label="Create new label" class="w-full">
                <span class="flex items-center gap-2 p-2 rounded-xl hover:bg-vLightAccent">
                    <Plus size="25" /> New Label
                </span>
            </Popover.Trigger>
            <Popover.Content>
                <NewLabelForm on:submit={() => (createNewOpen = false)} />
            </Popover.Content>
        </Popover.Root>
    {/if}
</span>
