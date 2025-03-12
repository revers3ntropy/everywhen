<script lang="ts">
    import ChevronLeft from 'svelte-material-icons/ChevronLeft.svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Dialog from '$lib/components/ui/dialog';
    import { goto } from '$app/navigation';
    import EventsList from '$lib/components/event/EventsList.svelte';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { listen } from '$lib/dataChangeEvents';
    import { tryDecryptText, tryEncryptText } from '$lib/utils/encryption.client.js';
    import Delete from 'svelte-material-icons/Delete.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import { obfuscated } from '$lib/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import DeleteLabelDialog from '../DeleteLabelDialog.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    let deleteDialogOpen = false;
    let nameDecrypted = tryDecryptText(data.label.name);

    async function updateName() {
        notify.onErr(
            await api.put(apiPath('/labels/?', data.label.id), {
                name: tryEncryptText(nameDecrypted)
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

    // if there are no entries or events tied to this
    // label, deleting it easy, but if there are then
    // a more complex approach is required to clear the
    // label from the entries and events
    async function deleteLabel() {
        notify.onErr(await api.delete(apiPath(`/labels/?`, data.label.id)));
        await goto('/labels');
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
    listen.event.onUpdate(({ label: l }, { label: oldLabel }) => {
        // As all events on this page have this label already,
        // they could only be removed from this label, not added
        // TODO: but what about changed twice...
        if (l?.id !== data.label.id && oldLabel?.id === data.label.id) {
            eventCount -= 1;
        }
    });
</script>

<svelte:head>
    <title>{nameDecrypted} | Label</title>
</svelte:head>

<main class="md:p-4 md:pl-4 flex-center">
    <div class="w-full md:max-w-5xl">
        <div>
            <a href="/labels">
                <Button variant="outline" class="border-border border-2 text-textColor">
                    <ChevronLeft /> All Labels
                </Button>
            </a>
        </div>
        <div class="overflow-x-hidden md:flex justify-between items-center py-2">
            <div class="flex-center gap-2">
                <Textbox bind:value={nameDecrypted} on:change={updateName} label="Name" />
                <span class="border-2 border-border p-2 rounded-xl w-fit h-fit mt-2">
                    {data.label.color}
                    <input
                        class="mb-1"
                        type="color"
                        bind:value={data.label.color}
                        on:change={updateColor}
                    />
                </span>
            </div>

            {#if data.label.entryCount + data.label.editCount + eventCount < 1}
                <button class="with-circled-icon danger" on:click={deleteLabel}>
                    <Delete size="30" />
                    Delete this Label
                </button>
            {:else}
                <Dialog.Root bind:open={deleteDialogOpen}>
                    <Dialog.Trigger>
                        <Delete size="30" />
                        Delete this Label
                    </Dialog.Trigger>
                    <Dialog.Content>
                        <DeleteLabelDialog
                            id={data.label.id}
                            color={data.label.color}
                            name={data.label.name}
                            onDelete={() => goto('/labels')}
                            cancel={() => (deleteDialogOpen = false)}
                            labels={data.labels}
                        />
                    </Dialog.Content>
                </Dialog.Root>
            {/if}
        </div>

        <div class="p-2 md:p-0 md:pb-4 md:pt-1 text-textColorLight italic">
            {data.label.entryCount} entries, {eventCount} events have this label
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
