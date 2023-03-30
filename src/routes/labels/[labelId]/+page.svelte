<script lang="ts">
    import { onMount } from 'svelte';
    import Delete from 'svelte-material-icons/Delete.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import Entries from '../../../lib/components/Entries.svelte';
    import type { Event as EventController } from '../../../lib/controllers/event';
    import type { Label } from '../../../lib/controllers/label';
    import { obfuscated } from '../../../lib/stores';
    import { api, apiPath } from '../../../lib/utils/apiRequest';
    import { displayNotifOnErr } from '../../../lib/utils/notifications';
    import { showPopup } from '../../../lib/utils/popups';
    import Event from '../../events/Event.svelte';
    import DeleteLabelDialog from '../DeleteLabelDialog.svelte';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData & {
        label: Label,
        entryCount: number
        events: EventController[],
        labels: Label[],
    };

    async function updateName () {
        displayNotifOnErr(addNotification,
            await api.put(data, apiPath('/labels/?', data.label.id), {
                name: data.label.name,
            }),
        );
    }

    async function updateColour () {
        displayNotifOnErr(addNotification,
            await api.put(data, apiPath('/labels/?', data.label.id), {
                colour: data.label.colour,
            }),
        );
    }

    onMount(() => document.title = `${data.label.name} - Label`);

    let eventCount = data.events.length;

    function changeEventCount (by: number) {
        eventCount += by;
    }

    async function deleteLabel () {

        // if there are no entries or events tied to this
        // label, deleting it easy, but if there are then
        // a more complex approach is required to clear the
        // label from the entries and events
        if (data.entryCount + eventCount < 1) {
            displayNotifOnErr(addNotification,
                await api.delete(data, apiPath(`/labels/?`, data.label.id)),
            );
            location.assign('../');
            return;
        }

        showPopup(DeleteLabelDialog, {
            auth: data,
            id: data.label.id,
            colour: data.label.colour,
            name: data.label.name,
            reloadOnDelete: false,
        }, () => {
            location.assign('/labels');
        });
    }

</script>

<svelte:head>
    <title>{data.label.name} - Label</title>
    <meta content="Label" name="description" />
</svelte:head>

<main>
    <div class="colour-select" style="border-color: {data.label.colour}">
        {data.label.colour}
        <input
            type="color"
            bind:value={data.label.colour}
            on:change={updateColour}
        >
    </div>
    <input
        class="name editable-text"
        bind:value={data.label.name}
        on:change={updateName}
    >
    <button class="primary" on:click={deleteLabel}>
        <Delete size="30" />
        Delete this Label
    </button>

    {#if eventCount > 0}
        <section>
            <h1>{eventCount} {eventCount === 1 ? "Event" : "Events"}</h1>
            <div class="events">
                {#each data.events as event}
                    <Event
                        auth={data}
                        event={event}
                        {changeEventCount}
                        labels={data.labels}
                        obfuscated={$obfuscated}
                    />
                {/each}
            </div>
        </section>
    {/if}

    <section>
        <h1>{data.entryCount} {data.entryCount === 1 ? "Entry" : "Entries"}</h1>
        <Entries
            auth={data}
            options={{ labelId: data.label.id }}
            showLabels={false}
            pageSize={data.settings.entriesPerPage.value}
        />
    </section>

</main>

<style lang="less">
    @import '../../../styles/layout';
    .name {
        font-size: 2em;
        font-weight: bold;
    }

    .colour-select {
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
