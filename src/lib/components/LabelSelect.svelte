<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import Dropdown from '../../lib/components/Dropdown.svelte';
    import type { Label } from '../controllers/label';
    import type { Auth } from '../controllers/user';
    import { api } from '../utils/apiRequest';
    import { displayNotifOnErr } from '../utils/notifications';
    import { showPopup } from '../utils/popups';
    import NewLabelDialog from './dialogs/NewLabelDialog.svelte';

    const dispatch = createEventDispatcher();

    const { addNotification } = getNotificationsContext();

    export let labels: Label[] = [];
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

    async function loadLabels() {
        const res = displayNotifOnErr(addNotification,
            await api.get(auth, '/labels'),
        );
        labels = res.labels;

        // if we delete a label while it was selected, unselect
        if (!labels.find(l => l.id === value) && value !== '') {
            console.error(`Label ${value} not found`);
            value = '';
        }
    }

    onMount(loadLabels);

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
                style="background: {labels
                    .find(l => l.id === value)?.colour || 'transparent'
                  }"
            ></span>
            {labels.find(l => l.id === value)?.name || '(No Label)'}
        </span>
        <button
            on:click={() => { closeDropDown(); value = '' }}
            class="label-button single"
            aria-label="Remove label"
        >
            <i>(No Label)</i>
        </button>
        {#each labels.filter(filter) as label (label.id)}
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
    @import '../../styles/variables.less';

    .select-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        background-color: @light-accent;
        border-radius: 10px;
        border: none;

        .icon-button {
            background: transparent;
            padding: 0.2em;
            border-radius: 10px;
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
            border-radius: 10px;
            border: 1px solid @border;
        }

        &.single {
            grid-template-columns: 1fr;
        }
    }
</style>