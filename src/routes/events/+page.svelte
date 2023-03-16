<script lang="ts">
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { App } from '../../app';
    import { api } from '../../lib/api/apiQuery';
    import type { Event as EventController } from '../../lib/controllers/event';
    import type { Label } from '../../lib/controllers/label';
    import { displayNotifOnErr, nowS } from '../../lib/utils.js';
    import Event from './Event.svelte';

    const NEW_EVENT_NAME = 'New Event';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData & {
        events: EventController[];
        labels: Label[];
    };

    type EventData = EventController & { deleted?: true };

    let events: EventData[] = data.events;

    async function reloadEvents () {
        events = displayNotifOnErr(addNotification,
            await api.get(data, '/events'),
        ).events;
    }

    async function newEvent () {
        const now = nowS();
        displayNotifOnErr(addNotification,
            await api.post(data, '/events', {
                name: NEW_EVENT_NAME,
                start: now,
                end: now,
            }),
        );

        await reloadEvents();
    }

    async function handleDeleteEvent (
        { detail: event }: CustomEvent<EventController>,
    ) {
        await reloadEvents();

        const deletedEvent: EventData = {
            ...event,
            deleted: true,
        };

        events = [
            ...events,
            deletedEvent,
        ].sort((a, b) => b.created - a.created);
    }

    let eventCount: number;
    $: eventCount = events.filter(e => !e.deleted).length;

    let selectNameId: string;
    $: selectNameId = events[
        events.findIndex(e => e.name === NEW_EVENT_NAME && !e.deleted)
        ]?.id || '';
</script>

<svelte:head>
    <title>Events</title>
    <meta content="Events" name="description" />
</svelte:head>

<main>
    <h1>Events ({eventCount})</h1>

    <ul>
        <li>
            <button
                class="primary unbordered"
                on:click={newEvent}
            >
                <Plus size="30" />
                New Event
            </button>
        </li>
        {#each events as event}
            <li>
                <Event
                    {event}
                    auth={data}
                    {selectNameId}
                    changeEventCount={(by) => eventCount += by}
                    on:update={reloadEvents}
                    on:delete={handleDeleteEvent}
                />
            </li>
        {/each}
    </ul>
</main>

<style lang="less">
    @import '../../styles/variables.less';
    @import '../../styles/layout.less';

    ul {
        list-style: none;
        padding: 0;
        display: grid;
        grid-template-columns: 50% 50%;

        @media @mobile {
            grid-template-columns: 100%;
            margin: 0;
        }

        li {
            .bordered();
            margin: .3rem .3em;
            padding: .4em;
            border-radius: 10px;

            &:first-child {
                .flex-center();
                border: none;
            }

            @media @mobile {
                margin: .3rem 0;
                padding: 0.5em 0 1em 0;
                border-radius: 0;
                border: none;
                border-top: 1px solid @border;
            }
        }
    }
</style>
