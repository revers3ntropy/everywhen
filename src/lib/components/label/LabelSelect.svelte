<script lang="ts">
    import LabelDot from '$lib/components/label/LabelDot.svelte';
    import { listen } from '$lib/dataChangeEvents';
    import { createEventDispatcher } from 'svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import LabelOffOutline from 'svelte-material-icons/LabelOffOutline.svelte';
    import LabelOutline from 'svelte-material-icons/LabelOutline.svelte';
    import Dropdown from '$lib/components/Dropdown.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import type { Auth } from '$lib/controllers/user/user';
    import { clientLogger } from '$lib/utils/log';
    import { showPopup } from '$lib/utils/popups';
    import NewLabelDialog from '$lib/components/dialogs/NewLabelDialog.svelte';
    import MenuDown from 'svelte-material-icons/MenuDown.svelte';

    export let fromRight = false;
    export let labels = null as Label[] | null;
    export let value = '';
    export let auth: Auth;
    export let showAddButton = true;
    export let filter: (l: Label, i: number, arr: Label[]) => boolean = () => true;
    export let condensed = false;

    function showNewLabelPopup() {
        showPopup(NewLabelDialog, { auth });
    }

    const dispatchEvent = createEventDispatcher();

    let closeDropDown: () => void;

    $: if (labels && value && !labels.find(l => l.id === value)) {
        clientLogger.error(`Label ${value} not found`);
        value = '';
    }

    $: dispatchEvent('change', { id: value });
    $: selectedLabel = (labels ?? []).find(l => l.id === value);
    $: labels = labels?.sort((a, b) => a.name.localeCompare(b.name)) || null;

    listen.label.onCreate(label => {
        labels = [...(labels || []), label];
        value = label.id;
    });
    listen.label.onUpdate(label => {
        if (!labels) {
            console.error('Labels not loaded but being updated');
            return;
        }

        labels = labels.map(l => (l.id === label.id ? label : l));
    });
    listen.label.onDelete(id => {
        if (!labels) {
            console.error('Labels not loaded but being deleted');
            return;
        }

        if (value === id) value = '';

        labels = labels.filter(l => l.id !== id);
    });
</script>

<span class="select-label" class:condensed>
    <Dropdown bind:close={closeDropDown} ariaLabel={() => 'Set label'} {fromRight}>
        <span slot="button" class="select-button">
            {#if labels}
                {#if selectedLabel}
                    <LabelDot big color={(labels ?? []).find(l => l.id === value)?.color || null} />

                    {#if !condensed}
                        <span class="label-name">
                            {selectedLabel.name}
                        </span>
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
            {:else}
                <span />
                <i class="text-light">
                    {#if !condensed}Loading{/if}...
                </i>
            {/if}
        </span>
        <div class="list-container">
            <button
                on:click={() => {
                    value = '';
                }}
                class="label-button"
                aria-label="Remove label"
            >
                <span class="flex-center">
                    <LabelOffOutline size="25" />
                </span>
                <span class="label-name"> No Label </span>
            </button>
            {#each (labels ?? []).filter(filter) as label (label.id)}
                <button
                    on:click={() => {
                        value = label.id;
                    }}
                    class="label-button"
                    aria-label="Select label {label.name}"
                >
                    <span class="flex-center">
                        <span
                            class="entry-label-color"
                            class:selected={value === label.id}
                            style="--label-color: {label.color}"
                        />
                    </span>
                    <span class="label-name">
                        {#if value === label.id}
                            <b>{label.name}</b>
                        {:else}
                            {label.name}
                        {/if}
                    </span>
                </button>
            {/each}
            {#if showAddButton}
                <button
                    on:click={showNewLabelPopup}
                    class="label-button"
                    aria-label="Create new label"
                >
                    <span class="flex-center">
                        <Plus size="25" />
                    </span>
                    <span class="label-name"> New Label </span>
                </button>
            {/if}
        </div>
    </Dropdown>
</span>

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/text';
    @import '../../../styles/layout';

    .entry-label-color {
        width: 20px;
        height: 20px;
        border: 4px solid var(--label-color);
        background: var(--background);
        display: inline-block;
        border-radius: 50%;

        &.selected {
            background: var(--label-color);
        }
    }

    .select-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: @border-radius;
        border: none;

        &:hover {
            background: var(--v-light-accent);
        }

        .icon-button {
            background: transparent;
            padding: 0.2em;
            border-radius: @border-radius;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--light-accent);

            &:hover {
                background: var(--background-color);
            }
        }

        .select-button {
            display: inline-grid;
            grid-template-columns: 25px 1fr 15px;
            align-items: center;
            justify-items: left;
            background: none;
            padding: 0.4rem 0.4rem 0.4rem 0.1rem;
        }

        &.condensed {
            .select-button {
                padding: 0.3rem;
                grid-template-columns: 1fr;
            }
        }
    }

    .label-button {
        height: 2em;
        margin: 0;
        text-align: center;
        display: inline-grid;
        grid-template-columns: 30px 1fr;
        justify-content: center;
        align-items: center;
        width: 100%;

        &:hover {
            background: var(--v-light-accent);
        }
    }

    .list-container {
        max-height: 80vh;
        overflow-y: auto;
        width: 200px;
        padding: 0.5em 0;
    }

    .label-name {
        .ellipsis();
        .flex-center();
        max-width: 100%;
        text-align: left;
        justify-content: start;
    }
</style>
