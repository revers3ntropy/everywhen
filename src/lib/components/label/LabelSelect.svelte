<script lang="ts">
    import CogOutline from 'svelte-material-icons/CogOutline.svelte';
    import LabelDot from '$lib/components/label/LabelDot.svelte';
    import { notify } from '$lib/components/notifications/notifications';
    import { listen } from '$lib/dataChangeEvents';
    import { createEventDispatcher } from 'svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import LabelOffOutline from 'svelte-material-icons/LabelOffOutline.svelte';
    import LabelOutline from 'svelte-material-icons/LabelOutline.svelte';
    import Dropdown from '$lib/components/ui/Dropdown.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import { showPopup } from '$lib/utils/popups';
    import NewLabelDialog from '$lib/components/dialogs/NewLabelDialog.svelte';
    import MenuDown from 'svelte-material-icons/MenuDown.svelte';

    export let fromRight = false;
    export let labels: Record<string, Label>;
    export let value = '';
    export let showAddButton = true;
    export let filter: (l: Label, i: number, arr: Label[]) => boolean = () => true;
    export let condensed = false;

    function showNewLabelPopup() {
        showPopup(NewLabelDialog, {});
    }

    const dispatchEvent = createEventDispatcher();

    let closeDropDown: () => void;

    $: dispatchEvent('change', { id: value });
    $: if (labels && value && !labels[value]) {
        notify.error(`Label not found`);
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

<span class="select-label" class:condensed>
    <Dropdown bind:close={closeDropDown} ariaLabel={() => 'Set label'} {fromRight}>
        <span slot="button" class="select-button">
            {#key value}
                {#if value && labels[value]}
                    <LabelDot big color={labels[value]?.color || null} />

                    {#if !condensed}
                        <span class="label-name">
                            {labels[value].name}
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
            {/key}
        </span>
        <div class="list-container">
            <a href="/labels" class="flex items-center gap-2 px-2 py-1">
                <CogOutline size="22" /> Manage Labels
            </a>

            <hr class="border-backgroundColor m-2" />

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
            {#each Object.values(labels)
                .filter(filter)
                .sort((a, b) => a.name.localeCompare(b.name)) as label (label.id)}
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

<style lang="scss">
    @import '$lib/styles/text';
    @import '$lib/styles/layout';

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
        border-radius: $border-radius;
        border: none;

        &:hover {
            background: var(--v-light-accent);
        }

        .icon-button {
            background: transparent;
            padding: 0.2em;
            border-radius: $border-radius;
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
        max-height: 30vh;
        overflow-y: auto;
        width: 200px;
        padding: 0.5em 0;
    }

    .label-name {
        @extend .ellipsis;
        @extend .flex-center;
        max-width: 100%;
        text-align: left;
        justify-content: flex-start;
    }
</style>
