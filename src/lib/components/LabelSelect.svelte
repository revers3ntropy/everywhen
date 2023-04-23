<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import Dropdown from '../../lib/components/Dropdown.svelte';
    import type { Label } from '../controllers/label';
    import type { Auth } from '../controllers/user';
    import { api } from '../utils/apiRequest';
    import { displayNotifOnErr, ERR_NOTIFICATION } from '../utils/notifications';
    import { showPopup } from '../utils/popups';
    import NewLabelDialog from './dialogs/NewLabelDialog.svelte';

    const dispatch = createEventDispatcher();

    const { addNotification } = getNotificationsContext();

    export let labels: Label[] | null;
    export let value = '';
    export let auth: Auth;
    export let showAddButton = true;
    export let filter: (l: Label, i: number, arr: Label[]) => boolean
        = () => true;

    let closeDropDown: () => void;

    $: dispatch('change', { id: value });

    function showNewLabelPopup () {
        showPopup(NewLabelDialog, { auth }, async () => {
            const res = displayNotifOnErr(addNotification,
                await api.get(auth, '/labels'),
            );
            labels = res.labels;
            // set to last created label
            value = labels.sort((a, b) => b.created - a.created)[0].id;
        });
    }

    $: if (labels && value !== '' && !labels.find(l => l.id === value)) {
        console.error(`Label ${value} not found`);
        value = '';
        addNotification({
            ...ERR_NOTIFICATION,
            text: `Can't find label`,
        });
    }

</script>
<div class="select-label">
    <Dropdown
        bind:close={closeDropDown}
        rounded
        ariaLabel="Select label"
    >
        <span slot="button" class="select-button">
            <span
                class="entry-label-colour"
                style="background: {(labels ?? [])
                    .find(l => l.id === value)?.colour || 'transparent'
                  }"
            ></span>
            {#if labels}
                {labels.find(l => l.id === value)?.name || '(No Label)'}
            {:else}
                loading...
            {/if}
        </span>
        <div class="list-container">
            <button
                    on:click={() => { closeDropDown(); value = '' }}
                    class="label-button single"
                    aria-label="Remove label"
            >
                <i>No Label</i>
            </button>
            {#each (labels ?? []).filter(filter) as label (label.id)}
                <button
                        on:click={() => { closeDropDown(); value = label.id }}
                        class="label-button"
                        aria-label="Select label {label.name}"
                >
                <span
                        class="entry-label-colour"
                        style="background: {label.colour}"
                ></span>
                    {#if value === label.id}
                        <b>{label.name}</b>
                    {:else}
                        {label.name}
                    {/if}
                </button>
            {/each}
        </div>
    </Dropdown>
    {#if showAddButton}
        <button
            on:click={showNewLabelPopup}
            class="icon-button"
            aria-label="Create new label"
        >
            <Plus size="25" />
        </button>
    {/if}
</div>
<style lang="less">
    @import '../../styles/variables';

    .select-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: @light-accent;
        border-radius: @border-radius;
        border: none;

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
            grid-template-columns: 20px 3fr;
            align-items: center;
            margin: 0 1em;
            justify-items: left;
        }
    }

    .label-button {
        height: 2em;
        width: 100%;
        padding: 0 1em;
        margin: 0;
        text-align: center;
        display: inline-grid;
        grid-template-columns: 1fr 3fr;
        justify-content: center;
        align-items: center;

        &:hover {
            background: @bg;
            border-radius: @border-radius;
            border: 1px solid @border;
        }

        &.single {
            grid-template-columns: 1fr;
        }
    }

    .list-container {
        max-height: 80vh;
        overflow-y: auto;
    }
</style>