<script lang="ts">
    import { goto } from '$app/navigation';
    import { listen } from '$lib/dataChangeEvents';
    import Delete from 'svelte-material-icons/Delete.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import { navExpanded, obfuscated } from '$lib/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { showPopup } from '$lib/utils/popups';
    import Event from '$lib/components/event/Event.svelte';
    import DeleteLabelDialog from '../DeleteLabelDialog.svelte';
    import type { PageData } from './$types';

    export let data: PageData;
    const { label, locations, entryCount, events, labels } = data;

    async function updateName() {
        notify.onErr(
            await api.put(apiPath('/labels/?', label.id), {
                name: label.name
            })
        );
    }

    async function updateColor() {
        notify.onErr(
            await api.put(apiPath('/labels/?', label.id), {
                color: label.color
            })
        );
    }

    async function deleteLabel() {
        // if there are no entries or events tied to this
        // label, deleting it easy, but if there are then
        // a more complex approach is required to clear the
        // label from the entries and events
        if (entryCount + eventCount < 1) {
            notify.onErr(await api.delete(apiPath(`/labels/?`, label.id)));
            await goto('../');
            return;
        }

        showPopup(
            DeleteLabelDialog,
            {
                id: label.id,
                color: label.color,
                name: label.name,
                reloadOnDelete: false
            },
            () => {
                void goto('/labels');
            }
        );
    }

    let eventCount = events.length;

    listen.event.onDelete(id => {
        if (events.find(e => e.id === id)) {
            eventCount -= 1;
        }
    });
    listen.event.onCreate(({ label: l }) => {
        if (l?.id === label.id) {
            eventCount += 1;
        }
    });
    listen.event.onUpdate(({ label: l }) => {
        // As all events on this page have this label already,
        // they could only be removed from this label, not added
        // TODO: but what about changed twice...
        if (l?.id !== label.id) {
            eventCount -= 1;
        }
    });
</script>

<svelte:head>
    <title>{label.name} | Label</title>
</svelte:head>

<main class="md:p-4 {$navExpanded ? 'md:ml-48' : 'md:ml-16'}">
    <div class="color-select" style="border-color: {label.color}">
        {label.color}
        <input type="color" bind:value={label.color} on:change={updateColor} />
    </div>
    <div class="title-line">
        <input class="name editable-text" bind:value={label.name} on:change={updateName} />
        <button class="with-circled-icon danger" on:click={deleteLabel}>
            <Delete size="30" />
            Delete this Label
        </button>
    </div>

    <section>
        <h1>
            {eventCount}
            Events
        </h1>
        <div class="events">
            {#each events as event}
                <Event {event} {labels} obfuscated={$obfuscated} />
            {/each}
        </div>
    </section>

    <section>
        <h1>{entryCount} Entries</h1>
        <Entries
            options={{ labelId: label.id }}
            showLabels={false}
            {locations}
            labels={data.labels}
        />
    </section>
</main>

<style lang="scss">
    @import '$lib/styles/layout';

    h1 {
        margin: 2rem 0 1rem 0;
    }

    .title-line {
        display: grid;
        grid-template-columns: 1fr auto;
        justify-content: space-between;
        align-items: center;

        @media #{$mobile} {
            display: block;
            justify-content: left;
            overflow-x: hidden;
        }
    }

    .name {
        font-size: 2em;
        font-weight: bold;
    }

    .color-select {
        width: calc(100% - 1em);
        border: none;
        border-bottom: 3px solid black;
        font-size: 1em;
        font-weight: bold;
        padding: 0.4em;
        margin: 0.4em 0;
    }

    .events {
        padding: 0;
        display: grid;
        grid-template-columns: 50% 50%;

        @media #{$mobile} {
            grid-template-columns: 100%;
            margin: 0;
        }
    }
</style>
