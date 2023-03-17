<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import Delete from 'svelte-material-icons/Delete.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import { api, apiPath } from '../../lib/api/apiQuery';
    import type { Auth } from '../../lib/controllers/user';
    import { displayNotifOnErr } from '../../lib/utils/notifications';
    import { showPopup } from '../../lib/utils/popups';
    import DeleteLabelDialog from './DeleteLabelDialog.svelte';

    const { addNotification } = getNotificationsContext();

    const dispatch = createEventDispatcher();

    export let auth: Auth;
    export let name: string;
    export let colour: string;
    export let id: string;
    export let editable = true;
    export let created: number;

    async function put (
        changes: {
            name?: string;
            colour?: string;
        },
    ) {
        displayNotifOnErr(addNotification,
            await api.put(auth, apiPath(`/labels/`, id), changes),
        );
        dispatch('updated');
    }

    async function deleteLabel () {
        if (numEntries === 0) {
            displayNotifOnErr(addNotification,
                await api.delete(auth, apiPath(`/labels/`, id)),
            );
            dispatch('updated');
            return;
        }

        showPopup(DeleteLabelDialog, {
            auth,
            id,
            colour,
            name,
        }, () => {
            dispatch('updated');
        });
    }

    let numEntries = -1;

    onMount(async () => {
        const entries = await api.get(auth, `/entries`, { labelId: id })
                                 .then(res => displayNotifOnErr(addNotification, res));
        numEntries = entries.entries.length;
    });
</script>
<div class="label {editable ? 'editable' : ''}">
    {#if editable}
        <input
            type="color"
            bind:value={colour}
            on:change={() => put({ colour })}
        />
        <input
            bind:value={name}
            class="editable-text"
            autocomplete="none"
            on:change={() => put({ name })}
        >
    {:else}
        <div class="entry-label-colour"
              style="background: {colour}"
        ></div>
        <div>{name}</div>
    {/if}
    <a class="text-light" href="/labels/{id}">
        {numEntries} {numEntries === 1 ? 'entry' : 'entries'}
    </a>
    <div>
        <button on:click={deleteLabel}>
            <Delete size="25" />
        </button>
    </div>
</div>

<style lang="less">
    .label {
        margin: 0.5em;
        display: grid;
        grid-template-columns: 25px 1fr 1fr 35px;
        justify-content: left;
        align-items: center;

        &.editable {
            grid-template-columns: 60px 1fr 1fr 35px;
        }
    }
</style>