<script lang="ts">
    import { browser } from '$app/environment';
    import moment from 'moment';
    import { onMount } from 'svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import Restore from 'svelte-material-icons/Restore.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import { api } from '../../lib/api/apiQuery';
    import { Event } from '../../lib/controllers/event';
    import type { Auth } from '../../lib/controllers/user';
    import { displayNotifOnErr, parseTimestampFromInput } from '../../lib/utils';
    import { fmtTimestampForInput } from '../../lib/utils.js';

    const { addNotification } = getNotificationsContext();

    export let event: Event;
    export let auth: Auth;
    export let selectNameId: string;
    export let changeEventCount: (by: number) => void;

    // for an undo button to replace the event when deleted
    let deleted = false;

    let nameInput: HTMLInputElement;

    async function updateEvent (changes) {
        displayNotifOnErr(addNotification,
            await api.put(auth, `/events/${event.id}`, changes),
        );
    }

    async function updateName ({ target }: Event) {
        await updateEvent({
            name: target.value,
        });
    }

    async function updateStart ({ target }: Event) {
        await updateEvent({
            start: parseTimestampFromInput(target.value),
        });
    }

    async function updateEnd ({ target }: Event) {
        await updateEvent({
            end: parseTimestampFromInput(target.value),
        });
    }

    async function deleteEvent () {
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }
        deleted = true;
        changeEventCount(-1);
        displayNotifOnErr(addNotification,
            await api.delete(auth, `/events/${event.id}`),
        );
    }

    async function restoreEvent () {
        deleted = false;
        changeEventCount(1);
        const { id } = displayNotifOnErr(addNotification,
            await api.post(auth, `/events`, {
                name: event.name,
                start: event.start,
                end: event.end,
                created: event.created,
                labels: event.label?.id,
            }),
        );
        event.id = id;
    }

    async function makeDurationEvent () {
        const newEnd = event.end + 60 * 60;
        await updateEnd({
            target: {
                value: fmtTimestampForInput(newEnd),
            },
        } as Event);
        event.end = newEnd;
    }

    const createdFmt = moment(new Date(event.start * 1000))
        .format('hh:mm DD/MM/YYYY');

    onMount(() => {
        if (selectNameId === event.id) {
            nameInput.focus();
            nameInput.select();
        }
    });

    $: if (browser && selectNameId === event.id && nameInput) {
        nameInput.focus();
    }

</script>

{#if deleted}
    <div class="restore-menu">
        <i>'{event.name}' has been deleted</i>
        <button
            class="primary unbordered"
            on:click={restoreEvent}
        >
            <Restore />
            Undo Deletion
        </button>
    </div>
{:else}
    <div class="header">
        <i>Created {createdFmt}</i>
        <button
            class="danger"
            on:click={deleteEvent}
        >
            <Bin size="25" />
        </button>
    </div>

    <input
        bind:this={nameInput}
        class="editable-text event-name-inp"
        on:change={updateName}
        placeholder="Event Name"
        value={event.name}
    >
    <div class="from-to-menu">
        {#if event.start === event.end}
            <div>
                <i>at</i>
                <input
                    class="editable-text"
                    on:change={(e) => (updateStart(e), updateEnd(e))}
                    placeholder="Start"
                    type="datetime-local"
                    value={fmtTimestampForInput(event.start)}
                >
            </div>
            <button
                class="link"
                on:click={makeDurationEvent}
            >
                Make duration event
            </button>
        {:else}
            <div>
                <i>from</i>
                <input
                    class="editable-text"
                    on:change={updateStart}
                    placeholder="Start"
                    type="datetime-local"
                    value={fmtTimestampForInput(event.start)}
                >
            </div>
            <div>
                <i>to</i>
                <input
                    class="editable-text"
                    on:change={updateEnd}
                    placeholder="End"
                    type="datetime-local"
                    value={fmtTimestampForInput(event.end)}
                >
            </div>
        {/if}
    </div>
{/if}

<style lang="less">
    @import '../../styles/variables.less';
    @import '../../styles/layout.less';

    i {
        font-size: 0.8em;
        color: @text-color-light;
    }

    .event-name-inp {
        font-size: 1.4rem;
        display: block;
        margin: 0.4em;
    }

    .header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .restore-menu {
        display: block;
        text-align: center;
        margin: 0.4em;
    }

    .from-to-menu {

        display: flex;
        flex-direction: row;
        justify-content: start;
        align-items: center;

        @media @mobile {
            display: block;
        }

        * {
            margin: 0 0.3em;
        }
    }
</style>