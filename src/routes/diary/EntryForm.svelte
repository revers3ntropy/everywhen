<script lang="ts">
    import { browser } from "$app/environment";
    import Geolocation from "svelte-geolocation";
    import Send from 'svelte-material-icons/Send.svelte';
    import { createEventDispatcher } from "svelte";
    import type { Label } from "$lib/types";

    const dispatch = createEventDispatcher();

    let newEntryTitle = (browser && localStorage.getItem('__misc_3_newEntryTitle')) || '';
    let newEntryBody = (browser && localStorage.getItem('__misc_3_newEntryBody')) || '';
    let newEntryLabel = (browser && localStorage.getItem('__misc_3_newEntryLabel')) || '';
    $: browser && localStorage.setItem('__misc_3_newEntryTitle', newEntryTitle);
    $: browser && localStorage.setItem('__misc_3_newEntryBody', newEntryBody);
    $: browser && localStorage.setItem('__misc_3_newEntryLabel', newEntryLabel);
    export let currentLocation = [];

    let labels: Label[] = [];

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

    <div class="head">
        <input placeholder="Title" class=title bind:value={newEntryTitle} />

        <select bind:value={newEntryLabel}>
            <option value="">No Label</option>
            {#each labels as label}
                <option value={label.id}>{label.name}</option>
            {/each}
            <option value="*">New Label</option>
        </select>

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

    * :global(.margins) {
        margin: 18px 0 24px;
    }

    * :global(.columns) {
        display: flex;
        flex-wrap: wrap;
    }

    * :global(.columns > *) {
        flex-basis: 0;
        min-width: 245px;
        margin-right: 12px;
    }
    * :global(.columns > *:last-child) {
        margin-right: 0;
    }
</style>