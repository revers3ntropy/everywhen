<script lang="ts">
    import { browser } from "$app/environment";
    import Geolocation from "svelte-geolocation";
    import Send from 'svelte-material-icons/Send.svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { createEventDispatcher } from "svelte";
    import type { Label } from "$lib/types";
    import NewLabelDialog from "./NewLabelDialog.svelte";
    import { api } from "$lib/api/apiQuery";
    import { writable } from 'svelte/store';
    import Modal, { bind } from 'svelte-simple-modal';
    import { onMount } from 'svelte';

    const dispatch = createEventDispatcher();

    let newEntryTitle = (browser && localStorage.getItem('__misc_3_newEntryTitle')) || '';
    let newEntryBody = (browser && localStorage.getItem('__misc_3_newEntryBody')) || '';
    let newEntryLabel = (browser && localStorage.getItem('__misc_3_newEntryLabel')) || '';
    $: browser && localStorage.setItem('__misc_3_newEntryTitle', newEntryTitle);
    $: browser && localStorage.setItem('__misc_3_newEntryBody', newEntryBody);
    $: browser && localStorage.setItem('__misc_3_newEntryLabel', newEntryLabel);

    export let key: string;
    let currentLocation = [];

    let labels: Label[] = [];

    onMount(async () => {
        const res = await api.get(key, `/labels`);
        labels = res.labels;
    });

    export function reset () {
        newEntryTitle = '';
        newEntryBody = '';
        newEntryLabel = '';
    }

    function submit () {
        dispatch('submit', {
            title: newEntryTitle,
            entry: newEntryBody,
            label: newEntryLabel,
            location: currentLocation
        });
    }

    const newLabelPopup = writable<any>(null);
    function showNewLabelPopup () {
        newLabelPopup.set(bind(NewLabelDialog, { key }));
    }

</script>
<div class="container">
    {#if browser}
        <Geolocation
            getPosition="true"
            let:error
            let:notSupported
            bind:coords={currentLocation}
        >
            {#if notSupported}
                This browser does not support the Geolocation API.
            {:else if error}
                An error occurred fetching geolocation data: {error.code} {error.message}
            {/if}
        </Geolocation>
    {/if}

    <Modal show={$newLabelPopup}
           classContent="popup-background"
           classWindow="popup-background"
    />

    <div class="head">
        <input placeholder="Title" class=title bind:value={newEntryTitle} />

        <div class="select-label">
            <select bind:value={newEntryLabel}>
                <option value="">No Label</option>
                {#each labels as label}
                    <option value={label.id}>{label.name}</option>
                {/each}
            </select>
            <button on:click={showNewLabelPopup}>
                <Plus size="25" />
            </button>
        </div>


        <button on:click={submit}>
            <Send size="30" />
        </button>
    </div>
    <textarea placeholder="Entry" class=entry bind:value={newEntryBody}></textarea>
</div>
<style lang="less">
    @import '../../styles/variables.less';

    .head {
        margin: 0;
        padding: 0.4em;
        border-bottom: 1px solid @border-light;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .title {
        border: none;
        width: 55%;
        font-size: 20px;
        margin: 0 0 0 1em;
    }

    .entry {
        border-radius: 0;
        outline: none;
        border: none;
        width: 90%;
        max-width: 1500px;
        height: 500px;
        font-size: 20px;
        padding: 1.2em;
    }

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

        button {
            background-color: transparent;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 0.3em;
            aspect-ratio: 1/1;
            border: 1px solid transparent;

            &:hover {
                background: @bg;
                border-radius: 10px;
                border: 1px solid @border;
            }
        }
    }
</style>