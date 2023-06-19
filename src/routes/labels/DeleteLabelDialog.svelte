<script lang="ts">
    import { dispatch } from '$lib/dataChangeEvents';
    import { onMount } from 'svelte';
    import BookSpinner from '$lib/components/BookSpinner.svelte';
    import LabelSelect from '$lib/components/label/LabelSelect.svelte';
    import type { Label } from '$lib/controllers/label';
    import type { Auth } from '$lib/controllers/user';
    import { popup } from '$lib/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/notifications/notifications';

    export let auth: Auth;
    export let id: string;
    export let color: string;
    export let name: string;
    export let reloadOnDelete = true;

    let entryCount = 0;
    let eventCount = 0;
    let labels = null as Label[] | null;

    let loaded = false;
    let changeLabelId: string;

    async function reloadEntries() {
        loaded = false;

        const entriesRes = displayNotifOnErr(
            await api.get(auth, `/entries`, { labelId: id })
        );
        entryCount = entriesRes.totalEntries;

        const eventsRes = displayNotifOnErr(
            await api.get(auth, `/events`, { labelId: id })
        );
        eventCount = eventsRes.events.filter(e => e.label?.id === id).length;

        const labelsRes = displayNotifOnErr(await api.get(auth, '/labels'));
        labels = labelsRes.labels;

        loaded = true;
    }

    async function rmLabel() {
        displayNotifOnErr(
            await api.delete(auth, apiPath(`/labels/?`, id), {
                strategy: 'remove'
            })
        );
        if (reloadOnDelete) {
            location.reload();
            return;
        }
        popup.set(null);
        await dispatch.delete('label', id);
    }

    async function reassign() {
        displayNotifOnErr(
            await api.delete(auth, apiPath(`/labels/?`, id), {
                strategy: 'reassign',
                newLabelId: changeLabelId
            })
        );
        if (reloadOnDelete) {
            location.reload();
            return;
        }
        popup.set(null);
        await dispatch.delete('label', id);
    }

    function cancel() {
        popup.set(null);
    }

    function filter(label: Label) {
        return label.id !== id;
    }

    onMount(reloadEntries);
</script>

<div>
    <h1>Delete Label '{name}'</h1>
    <p>
        There are {entryCount} entries and {eventCount} events with this label.
    </p>

    {#if !loaded}
        <BookSpinner />
    {:else}
        <div class="options">
            <div>
                {#if labels}
                    <LabelSelect
                        {auth}
                        bind:value={changeLabelId}
                        {filter}
                        {labels}
                    />
                {:else}
                    Loading...
                {/if}
                <button on:click={reassign}>
                    Give Different Label to Entries/Events with this Label
                </button>
            </div>

            <h2>OR</h2>

            <div>
                <button on:click={rmLabel}>
                    Delete Label and Remove from Entries/Events
                </button>
            </div>

            <div class="cancel">
                <button on:click|self={cancel}> Cancel </button>
            </div>
        </div>
    {/if}
</div>

<style lang="less">
    @import '../../styles/variables';

    h1 {
        margin: 0 0 1rem 0;
    }

    .options {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 2rem;

        & > div {
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--border-color);
            border-radius: @border-radius;
            padding: 0.6em;
            margin: 0.5em;

            button {
                border-radius: @border-radius;
                margin: 0.5rem;
                padding: 0.3rem;

                &:hover {
                    background: var(--accent-danger);
                }
            }

            &.cancel {
                border: none;

                button {
                    padding: 0.5rem;

                    &:hover {
                        background: var(--light-accent);
                    }
                }
            }
        }
    }

    button {
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
