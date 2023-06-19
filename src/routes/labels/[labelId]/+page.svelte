<script lang="ts">
    import { goto } from '$app/navigation';
    import { listen } from '$lib/dataChangeEvents';
    import { onMount } from 'svelte';
    import Delete from 'svelte-material-icons/Delete.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import { obfuscated } from '$lib/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/notifications/notifications';
    import { showPopup } from '$lib/utils/popups';
    import Event from '$lib/components/event/Event.svelte';
    import DeleteLabelDialog from '../DeleteLabelDialog.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    async function updateName() {
        displayNotifOnErr(
            await api.put(data, apiPath('/labels/?', data.label.id), {
                name: data.label.name
            })
        );
    }

    async function updateColor() {
        displayNotifOnErr(
            await api.put(data, apiPath('/labels/?', data.label.id), {
                color: data.label.color
            })
        );
    }

    async function deleteLabel() {
        // if there are no entries or events tied to this
        // label, deleting it easy, but if there are then
        // a more complex approach is required to clear the
        // label from the entries and events
        if (data.entryCount + eventCount < 1) {
            displayNotifOnErr(
                await api.delete(data, apiPath(`/labels/?`, data.label.id))
            );
            await goto('../');
            return;
        }

        showPopup(
            DeleteLabelDialog,
            {
                auth: data,
                id: data.label.id,
                color: data.label.color,
                name: data.label.name,
                reloadOnDelete: false
            },
            () => {
                void goto('/labels');
            }
        );
    }

    onMount(() => (document.title = `${data.label.name} - Label`));
    let eventCount = data.events.length;

    listen.event.onDelete(id => {
        if (data.events.find(e => e.id === id)) {
            eventCount -= 1;
        }
    });
    listen.event.onCreate(({ label }) => {
        if (label?.id === data.label.id) {
            eventCount += 1;
        }
    });
    listen.event.onUpdate(({ label }) => {
        // As all events on this page have this label already,
        // they could only be removed from this label, not added
        // TODO: but what about changed twice...
        if (label?.id !== data.label.id) {
            eventCount -= 1;
        }
    });
</script>

<svelte:head>
    <title>{data.label.name} - Label</title>
    <meta content="Label" name="description" />
</svelte:head>

<main>
    <div class="color-select" style="border-color: {data.label.color}">
        {data.label.color}
        <input
            type="color"
            bind:value={data.label.color}
            on:change={updateColor}
        />
    </div>
    <div class="title-line">
        <input
            class="name editable-text"
            bind:value={data.label.name}
            on:change={updateName}
        />
        <button class="with-circled-icon danger" on:click={deleteLabel}>
            <Delete size="30" />
            Delete this Label
        </button>
    </div>

    <section>
        <h1>
            {eventCount}
            Event{eventCount !== 1 ? 's' : ''}
        </h1>
        <div class="events">
            {#each data.events as event}
                <Event
                    auth={data}
                    {event}
                    labels={data.labels}
                    obfuscated={$obfuscated}
                />
            {/each}
        </div>
    </section>

    <section>
        <h1>{data.entryCount} Entr{data.entryCount === 1 ? 'y' : 'ies'}</h1>
        <Entries
            auth={data}
            options={{ labelId: data.label.id }}
            showLabels={false}
            hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
        />
    </section>
</main>

<style lang="less">
    @import '../../../styles/layout';

    h1 {
        margin: 2rem 0 1rem 0;
    }

    .title-line {
        display: grid;
        grid-template-columns: 1fr auto;
        justify-content: space-between;
        align-items: center;

        @media @mobile {
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

        @media @mobile {
            grid-template-columns: 100%;
            margin: 0;
        }
    }
</style>
