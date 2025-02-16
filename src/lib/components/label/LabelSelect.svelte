<script lang="ts">
    import NewLabelForm from '$lib/components/label/NewLabelForm.svelte';
    import * as Popover from '$lib/components/ui/popover';
    import EncryptedText from '$lib/components/ui/EncryptedText.svelte';
    import { tryDecryptText } from '$lib/utils/encryption.client.js';
    import CogOutline from 'svelte-material-icons/CogOutline.svelte';
    import LabelDot from '$lib/components/label/LabelDot.svelte';
    import { listen } from '$lib/dataChangeEvents';
    import { createEventDispatcher } from 'svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import LabelOffOutline from 'svelte-material-icons/LabelOffOutline.svelte';
    import LabelOutline from 'svelte-material-icons/LabelOutline.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import MenuDown from 'svelte-material-icons/MenuDown.svelte';

    export let labels: Record<string, Label>;
    export let value = '';
    export let showAddButton = true;
    export let keepOpenOnSelect = false;
    export let filter: (l: Label, i: number, arr: Label[]) => boolean = () => true;
    export let condensed = false;

    let open = false;
    let createNewOpen = false;

    const dispatchEvent = createEventDispatcher();

    function onChange(value: string) {
        dispatchEvent('change', { id: value });
        if (!keepOpenOnSelect) open = false;
    }
    $: onChange(value);

    // if the user deletes a label but the value has been stored
    // in localStorage so does not get updated,
    // can be in a state where the value is not valid, so reset it silently
    $: if (labels && value && !labels[value]) {
        value = '';
    }

    listen.label.onCreate(label => {
        labels[label.id] = label;
        value = label.id;
    });
    listen.label.onUpdate(label => {
        labels[label.id] = label;
    });
    listen.label.onDelete(id => {
        if (value === id) value = '';
        delete labels[id];
    });
</script>

<Popover.Root bind:open>
    <Popover.Trigger class="flex gap-2 items-center rounded-full hover:bg-vLightAccent p-2">
        {#key value}
            {#if value && labels[value]}
                <LabelDot big color={labels[value]?.color || null} />

                {#if !condensed}
                    <EncryptedText text={labels[value].name} />
                {/if}
            {:else}
                <LabelOutline size="20" />
                {#if !condensed}
                    Add Label
                {/if}
            {/if}
            {#if !condensed}
                <MenuDown size="20" />
            {/if}
        {/key}
    </Popover.Trigger>
    <Popover.Content>
        <div class="flex flex-col max-h-[500px] overflow-y-auto">
            <a href="/labels" class="flex items-center gap-2 p-2 rounded-xl hover:bg-vLightAccent">
                <CogOutline size="22" /> Manage Labels
            </a>

            {#if showAddButton}
                <Popover.Root bind:open={createNewOpen}>
                    <Popover.Trigger aria-label="Create new label" class="w-full">
                        <span class="flex items-center gap-2 p-2 rounded-xl hover:bg-vLightAccent">
                            <Plus size="25" /> New Label
                        </span>
                    </Popover.Trigger>
                    <Popover.Content>
                        <NewLabelForm
                            on:submit={() => {
                                open = false;
                                createNewOpen = false;
                            }}
                        />
                    </Popover.Content>
                </Popover.Root>
            {/if}

            <hr class="border-backgroundColor m-2" />

            <button
                on:click={() => {
                    value = '';
                }}
                class="flex items-center gap-2 p-2 rounded-xl hover:bg-vLightAccent"
                aria-label="Remove label"
            >
                <LabelOffOutline size="25" />
                No Label
            </button>
            {#each Object.values(labels)
                .filter(filter)
                .sort( (a, b) => tryDecryptText(a.name).localeCompare(tryDecryptText(b.name)) ) as label (label.id)}
                <button
                    on:click={() => (value = label.id)}
                    class="flex items-center gap-2 p-2 rounded-xl hover:bg-vLightAccent"
                    aria-label="Select label {tryDecryptText(label.name)}"
                >
                    <span
                        class="w-[20px] h-[20px] border-4 inline-block rounded-full"
                        style="border-color: {label.color}; background-color: {value === label.id
                            ? label.color
                            : 'transparent'}"
                    />
                    <EncryptedText
                        text={label.name}
                        class={`text-left ${value === label.id ? 'text-bold' : ''}`}
                    />
                </button>
            {/each}
        </div>
    </Popover.Content>
</Popover.Root>
