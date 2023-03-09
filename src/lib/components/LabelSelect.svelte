<script lang="ts">
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import Dropdown from '../../lib/components/Dropdown.svelte';
    import { api } from '../api/apiQuery';
    import { Label } from '../controllers/label';
    import { displayNotifOnErr, showPopup } from '../utils';
    import NewLabelDialog from './dialogs/NewLabelDialog.svelte';

    const { addNotification } = getNotificationsContext();

    let closeLabelDropDown;

    let labels = [];
    export let value = "";
    export let auth;
    export let filter: (l: Label) => boolean = () => true;

    function showNewLabelPopup () {
        showPopup(NewLabelDialog, { auth }, async () => {
            const res = displayNotifOnErr(addNotification,
                await api.get(auth, '/labels'),
            );
            labels = res.labels;
            value = labels.sort((a, b) => b.created - a.created)[0].id;
        });
    }

    async function loadLabels() {
        const res = displayNotifOnErr(addNotification,
            await api.get(auth, '/labels'),
        );
        labels = res.labels;

        // if we delete a label while it was selected, unselect
        if (!labels.find(l => l.id === value)) {
            value = '';
        }
    }

    $: loadLabels();

</script>
<div class="select-label">
    <Dropdown bind:value={value} bind:close={closeLabelDropDown}>
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
            on:click={() => { closeLabelDropDown(); value = '' }}
            class="label-button single"
        >
            <i>(No Label)</i>
        </button>
        {#each labels.filter(filter) as label (label.id)}
            <button
                on:click={() => { closeLabelDropDown(); value = label.id }}
                class="label-button"
            >
                <span
                    class="entry-label-colour"
                    style="background: {label.colour}"
                ></span>
                {#if label === label.id}
                    <b>✓ {label.name}</b>
                {:else}
                    {label.name}
                {/if}
            </button>
        {/each}
    </Dropdown>

    <button on:click={showNewLabelPopup} class="icon-button">
        <Plus size="25" />
    </button>
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

        select {
            background-color: transparent;
            border: none;
        }

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