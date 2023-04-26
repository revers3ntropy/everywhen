<script lang="ts">
    import { onMount } from 'svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import BookSpinner from '../../lib/components/BookSpinner.svelte';
    import LabelSelect from '../../lib/components/LabelSelect.svelte';
    import type { Entry } from '../../lib/controllers/entry';
    import type { Event } from '../../lib/controllers/event';
    import type { Label } from '../../lib/controllers/label';
    import type { Auth } from '../../lib/controllers/user';
    import { popup } from '../../lib/stores';
    import { api, apiPath } from '../../lib/utils/apiRequest';
    import { displayNotifOnErr } from '../../lib/utils/notifications';

    const { addNotification } = getNotificationsContext();

    export let auth: Auth;
    export let id: string;
    export let colour: string;
    export let name: string;
    export let reloadOnDelete = true;

    let entries: Entry[] = [];
    let events: Event[] = [];
    let labels: Label[] | null = null;

    let loaded = false;
    let changeLabelId: string;

    async function reloadEntries() {
        loaded = false;
        const entriesRes = displayNotifOnErr(
            addNotification,
            await api.get(auth, `/entries`, { labelId: id })
        );
        entries = entriesRes.entries;
        const eventsRes = displayNotifOnErr(
            addNotification,
            await api.get(auth, `/events`, { labelId: id })
        );
        events = eventsRes.events.filter(e => e.label?.id === id);

        const labelsRes = displayNotifOnErr(
            addNotification,
            await api.get(auth, '/labels')
        );
        labels = labelsRes.labels;

        loaded = true;
    }

    async function rmLabel() {
        displayNotifOnErr(
            addNotification,
            await api.delete(auth, apiPath(`/labels/?`, id), {
                strategy: 'remove'
            })
        );
        if (reloadOnDelete) {
            location.reload();
        } else {
            popup.set(null);
        }
    }

    async function reassign() {
        displayNotifOnErr(
            addNotification,
            await api.delete(auth, apiPath(`/labels/?`, id), {
                strategy: 'reassign',
                newLabelId: changeLabelId
            })
        );
        if (reloadOnDelete) {
            location.reload();
        } else {
            popup.set(null);
        }
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
    <p
        >There are {entries.length} entries and {events.length} events with this
        label.</p
    >

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
    @import '../../styles/variables.less';

    .options {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 2rem;

        & > div {
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid @border;
            border-radius: @border-radius;
            padding: 0.6em;
            margin: 0.5em;

            button {
                border-radius: @border-radius;
                margin: 0.5rem;
                padding: 0.3rem;

                &:hover {
                    background: @accent-color-danger;
                }
            }

            &.cancel {
                border: none;

                button {
                    padding: 0.5rem;

                    &:hover {
                        background: @light-accent;
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
