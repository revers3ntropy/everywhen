<script lang="ts">
    import { dispatch } from '$lib/dataChangeEvents';
    import Delete from 'svelte-material-icons/Delete.svelte';
    import type { Auth } from '$lib/controllers/user/user';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import { showPopup } from '$lib/utils/popups';
    import DeleteLabelDialog from './DeleteLabelDialog.svelte';

    export let auth: Auth;

    export let id: string;
    export let color: string;
    export let name: string;
    export let created: number;

    export let editable = true;
    export let entryCount: number;
    export let eventCount: number;

    async function updateLabel(changes: { name?: string; color?: string }) {
        displayNotifOnErr(await api.put(auth, apiPath(`/labels/?`, id), changes));
        await dispatch.update('label', {
            id,
            created,
            color,
            name,
            ...changes
        });
    }

    async function deleteLabel() {
        // if there are no entries or events tied to this
        // label, deleting it easy, but if there are then
        // a more complex approach is required to clear the
        // label from the entries and events
        if (entryCount + eventCount < 1) {
            displayNotifOnErr(await api.delete(auth, apiPath(`/labels/?`, id)));
            await dispatch.delete('label', id);
            return;
        }

        showPopup(DeleteLabelDialog, {
            auth,
            id,
            color,
            name
        });
    }
</script>

<div class="label {editable ? 'editable' : ''}">
    {#if editable}
        <input type="color" bind:value={color} on:change={() => updateLabel({ color })} />
        <input
            bind:value={name}
            class="editable-text"
            type="text"
            on:change={() => updateLabel({ name })}
        />
    {:else}
        <div class="entry-label-color" style="background: {color}" />
        <div>{name}</div>
    {/if}
    <a href="/labels/{id}">
        {entryCount}
        {entryCount === 1 ? 'entry' : 'entries'}
        {#if eventCount > 0},
            {eventCount}
            {eventCount === 1 ? 'event' : 'events'}
        {/if}
    </a>
    <div>
        <button on:click={deleteLabel} class="icon-button">
            <Delete size="30" />
        </button>
    </div>
</div>

<style lang="less">
    @import '../../../styles/variables';

    .label {
        margin: 0.5em;
        display: grid;
        grid-template-columns: 25px 1fr 1fr 35px;
        justify-content: left;
        align-items: center;

        &.editable {
            grid-template-columns: 60px 1fr 1fr 35px;
        }

        @media @mobile {
            max-width: 100vw;
            grid-template-columns: 15px 1fr 1fr 35px;

            input[type='text'] {
                width: 100%;
            }

            a {
                overflow-wrap: break-word;
            }
        }
    }
</style>
