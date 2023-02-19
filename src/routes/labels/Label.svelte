<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { Auth, Entry } from "$lib/types";
    import { api } from "$lib/api/apiQuery";
    import { showPopup } from "$lib/utils";
    import DeleteLabelDialog from "./DeleteLabelDialog.svelte";
    import Delete from 'svelte-material-icons/Delete.svelte';

    const dispatch = createEventDispatcher();

    export let auth: Auth;
    export let name: string;
    export let colour: string;
    export let id: string;
    export let editable = true;
    export let created;

    async function put (changes: any) {
        await api.put(auth, `/labels/${id}`, changes);
        dispatch('updated');
    }

    async function deleteLabel () {
        if (numEntries === 0) {
            await api.delete(auth, `/labels/${id}`);
            dispatch('updated');
            return;
        }

        showPopup(DeleteLabelDialog, {
            auth,
            id,
            colour,
            name
        }, () => {
            dispatch('updated');
        });
    }

    let numEntries = -1;

    $: api.get(auth, `/entries?labelId=${id}`)
            .then((entries: { entries: Entry[] }) => {
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