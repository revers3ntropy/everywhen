<script lang="ts">
    import { goto } from '$app/navigation';
    import EventsList from '$lib/components/event/EventsList.svelte';
    import { listen } from '$lib/dataChangeEvents';
    import Delete from 'svelte-material-icons/Delete.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import { navExpanded, obfuscated } from '$lib/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { showPopup } from '$lib/utils/popups';
    import DeleteLabelDialog from '../DeleteLabelDialog.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    async function updateName() {
        notify.onErr(
            await api.put(apiPath('/labels/?', data.label.id), {
                name: data.label.name
            })
        );
    }

    async function updateColor() {
        notify.onErr(
            await api.put(apiPath('/labels/?', data.label.id), {
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
            notify.onErr(await api.delete(apiPath(`/labels/?`, data.label.id)));
            await goto('../');
            return;
        }

        showPopup(
            DeleteLabelDialog,
            {
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

    let eventCount = data.events.length;

    listen.event.onDelete(id => {
        if (data.events.find(e => e.id === id)) {
            eventCount -= 1;
        }
    });
    listen.event.onCreate(({ label: l }) => {
        if (l?.id === data.label.id) {
            eventCount += 1;
        }
    });
    listen.event.onUpdate(({ label: l }) => {
        // As all events on this page have this label already,
        // they could only be removed from this label, not added
        // TODO: but what about changed twice...
        if (l?.id !== data.label.id) {
            eventCount -= 1;
        }
    });
</script>

<svelte:head>
    <title>{data.label.name} | Label</title>
</svelte:head>

<main class="md:p-4 {$navExpanded ? 'md:ml-48' : 'md:ml-16'} flex-center">
    <div class="w-full md:max-w-5xl">
        <div class="w-100 border-b-4 font-bold py-1" style="border-color: {data.label.color}">
            {data.label.color}
            <input type="color" bind:value={data.label.color} on:change={updateColor} />
        </div>
        <div class="title-line">
            <input
                class="font-bold text-[2em] editable-text py-1"
                bind:value={data.label.name}
                on:change={updateName}
            />
            <button class="with-circled-icon danger" on:click={deleteLabel}>
                <Delete size="30" />
                Delete this Label
            </button>
        </div>
        <div class="p-2 md:p-0 md:pb-4 md:pt-1 text-textColorLight italic">
            {data.entryCount} entries, {eventCount} events have this label
        </div>

        <section>
            <EventsList labels={data.labels} events={data.events} obfuscated={$obfuscated} />
        </section>

        <section class="pt-4">
            <Entries
                options={{ labelId: data.label.id }}
                showLabels={false}
                locations={data.locations}
                labels={data.labels}
            />
        </section>
    </div>
</main>

<style lang="scss">
    @import '$lib/styles/layout';

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
</style>
