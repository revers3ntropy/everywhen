<script lang="ts">
    import BookSpinner from '$lib/components/BookSpinner.svelte';
    import { onMount } from 'svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import LabelSelect from '../../lib/components/LabelSelect.svelte';
    import type { Entry } from '../../lib/controllers/entry';
    import type { Event } from '../../lib/controllers/event';
    import type { Auth } from '../../lib/controllers/user';
    import { popup } from '../../lib/stores';
    import { api, apiPath } from '../../lib/utils/apiRequest';
    import { displayNotifOnErr } from '../../lib/utils/notifications';

    const { addNotification } = getNotificationsContext();

    export let auth: Auth;
    export let id: string;
    export let colour: string;
    export let name: string;

    let entries: Entry[] = [];
    let events: Event[] = [];

    let loaded = false;

    async function reloadEntries () {

        loaded = false;
        const entriesRes = displayNotifOnErr(addNotification,
            await api.get(auth, `/entries`, { labelId: id }),
        );
        entries = entriesRes.entries;
        const eventsRes = displayNotifOnErr(addNotification,
            await api.get(auth, `/events`, { labelId: id }),
        );
        events = eventsRes.events
                          .filter(e => e.label?.id === id);
        loaded = true;
    }

    onMount(reloadEntries);

    let changeLabelId: string;

    async function rmLabel () {
        displayNotifOnErr(addNotification,
            await api.delete(auth, apiPath(`/labels/?`, id), {
                strategy: 'remove',
            }),
        );
        location.reload();
    }

    async function reassign () {
        displayNotifOnErr(addNotification,
            await api.delete(auth, apiPath(`/labels/?`, id), {
                strategy: 'reassign',
                newLabelId: changeLabelId,
            }),
        );
        location.reload();
    }

    function cancel () {
        popup.set(null);
    }
</script>

<div>
    <h1>Delete Label '{name}'</h1>
    <p>There are {entries.length} entries and {events.length} events with this label.</p>


    {#if !loaded}
        <BookSpinner />
    {:else}
        <div class="options">
            <div>
                <LabelSelect
                    {auth}
                    bind:value={changeLabelId}
                    filter={label => label.id !== id}
                />
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
                <button on:click|self={cancel}>
                    Cancel
                </button>
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
            border-radius: 10px;
            padding: 0.6em;
            margin: 0.5em;

            button {
                border-radius: 10px;
                margin: .5rem;
                padding: .3rem;

                &:hover {
                    background: @accent-color-danger;
                }
            }

            &.cancel {
                border: none;

                button {
                    padding: .5rem;

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