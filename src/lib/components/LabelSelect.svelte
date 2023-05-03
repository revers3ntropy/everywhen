<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import LabelOffOutline from 'svelte-material-icons/LabelOffOutline.svelte';
    import LabelOutline from 'svelte-material-icons/LabelOutline.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import Dropdown from '$lib/components/Dropdown.svelte';
    import type { Label } from '../controllers/label';
    import type { Auth } from '../controllers/user';
    import { api } from '../utils/apiRequest';
    import { errorLogger } from '../utils/log';
    import {
        displayNotifOnErr,
        ERR_NOTIFICATION
    } from '../utils/notifications';
    import { showPopup } from '../utils/popups';
    import NewLabelDialog from './dialogs/NewLabelDialog.svelte';
    import MenuDown from 'svelte-material-icons/MenuDown.svelte';

    const dispatch = createEventDispatcher();

    const { addNotification } = getNotificationsContext();

    export let labels: Label[] | null;
    export let value = '';
    export let auth: Auth;
    export let showAddButton = true;
    export let filter: (l: Label, i: number, arr: Label[]) => boolean = () =>
        true;

    let closeDropDown: () => void;

    $: dispatch('change', { id: value });

    function showNewLabelPopup() {
        showPopup(NewLabelDialog, { auth }, async () => {
            const res = displayNotifOnErr(
                addNotification,
                await api.get(auth, '/labels')
            );
            labels = res.labels;
            // set to last created label
            value = labels.sort((a, b) => b.created - a.created)[0].id;
        });
    }

    $: if (labels && value !== '' && !labels.find(l => l.id === value)) {
        errorLogger.error(`Label ${value} not found`);
        value = '';
        addNotification({
            ...ERR_NOTIFICATION,
            text: `Can't find label`
        });
    }

    $: selectedLabel = (labels ?? []).find(l => l.id === value);
</script>

<div class="select-label">
    <Dropdown
        bind:close={closeDropDown}
        rounded
        unstyledButton
        ariaLabel="Select label"
        fromRight
    >
        <span slot="button" class="select-button">
            {#if labels}
                {#if selectedLabel}
                    <span
                        class="entry-label-colour"
                        style="background: {(labels ?? []).find(
                            l => l.id === value
                        )?.colour || 'transparent'}"
                    />
                    <span class="label-name">
                        {selectedLabel.name}
                    </span>
                {:else}
                    <LabelOutline size="20" />
                    Add Label
                {/if}
                <MenuDown />
            {:else}
                <span />
                <i class="text-light">loading...</i>
            {/if}
        </span>
        <div class="list-container">
            <button
                on:click={() => {
                    closeDropDown();
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
                        closeDropDown();
                        value = label.id;
                    }}
                    class="label-button"
                    aria-label="Select label {label.name}"
                >
                    <span class="flex-center">
                        <span
                            class="entry-label-colour"
                            style="background: {label.colour}"
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
</div>

<style lang="less">
    @import '../../styles/variables';

    .entry-label-colour {
        border: 1px solid @border-light;
        width: 20px;
        height: 20px;
    }

    .select-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: @border-radius;
        border: none;

        &:hover {
            background: @light-v-accent;
        }

        .icon-button {
            background: transparent;
            padding: 0.2em;
            border-radius: @border-radius;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid @light-accent;

            &:hover {
                background: @bg;
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
    }

    .label-button {
        height: 2em;
        padding: 0 0.5em;
        margin: 0;
        text-align: center;
        display: inline-grid;
        grid-template-columns: 1fr 3fr;
        justify-content: center;
        align-items: center;
        width: 100%;
        border-radius: @border-radius;

        &:hover {
            background: @light-v-accent;
        }
    }

    .list-container {
        max-height: 80vh;
        overflow-y: auto;
        width: 200px;
    }

    .label-name {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        max-width: 100%;
        text-align: left;
    }
</style>
