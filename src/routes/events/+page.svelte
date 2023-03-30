<script lang="ts">
    import { onMount } from 'svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import TrayArrowUp from 'svelte-material-icons/TrayArrowUp.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { App } from '../../app';
    import ImportDialog from '../../lib/components/dialogs/ImportDialog.svelte';
    import Select from '../../lib/components/Select.svelte';
    import type { Event as EventController } from '../../lib/controllers/event';
    import type { Label } from '../../lib/controllers/label';
    import { eventsSortKey, obfuscated } from '../../lib/stores';
    import { api } from '../../lib/utils/apiRequest';
    import { displayNotifOnErr } from '../../lib/utils/notifications';
    import { showPopup } from '../../lib/utils/popups';
    import { nowS } from '../../lib/utils/time';
    import type { EventsSortKey } from '../../lib/utils/types';
    import Event from './Event.svelte';

    const NEW_EVENT_NAME = 'New Event';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData & {
        events: EventController[];
        labels: Label[];
    };

    type EventData = EventController & { deleted?: true };

    let events: EventData[] = data.events;

    function sortEvents<T extends Event | EventData> (
        events: T[],
        key: EventsSortKey,
    ): T[] {
        if (events.length === 0) return [];
        if (typeof events[0][key] === 'string') {
            return events.sort((a, b) => {
                return a[key]
                    .toString()
                    .localeCompare(b[key]?.toString());
            });
        } else if (typeof events[0][key] === 'number') {
            return events.sort((a, b) => {
                return b[key] - a[key];
            });
        }
        throw new Error('Invalid sort key');
    }

    async function reloadEvents () {
        events = sortEvents(displayNotifOnErr(addNotification,
            await api.get(data, '/events'),
        ).events, $eventsSortKey);
    }

    $: events = sortEvents(events, $eventsSortKey);

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

    function importPopup () {
        showPopup(ImportDialog, {
            auth: data,
            type: 'events',
        }, reloadEvents);
    }

    let eventCount: number;
    $: eventCount = events.filter(e => !e.deleted).length;

    let selectNameId: string;
    $: selectNameId = events[
        events.findIndex(e => e.name === NEW_EVENT_NAME && !e.deleted)
        ]?.id || '';

    const sortEventsKeys = {
        'created': 'created',
        'start': 'start',
        'end': 'end',
        'name': 'name',
    };

    onMount(() => document.title = `Events`);

</script>

<svelte:head>
    <title>Events</title>
    <meta content="Events" name="description" />
</svelte:head>

<main>
    <div class="menu">
        <div class="flex-center">
            <button
                class="primary"
                on:click={newEvent}
            >
                <Plus size="30" />
                New Event
            </button>
            <button class="primary" on:click={importPopup}>
                <TrayArrowUp size="30" />
                Import
            </button>
        </div>

        <h1>Events ({eventCount})</h1>

        <div class="flex-center">
            Sort by
            <Select
                bind:key={$eventsSortKey}
                options={sortEventsKeys}
            />
        </div>
    </div>
    <ul>
        {#each events as event}
            <li>
                <Event
                    {event}
                    auth={data}
                    {selectNameId}
                    changeEventCount={(by) => eventCount += by}
                    on:update={reloadEvents}
                    on:delete={handleDeleteEvent}
                    labels={data.labels}
                    obfuscated={$obfuscated}
                />
            </li>
        {/each}
    </ul>
</main>

<style lang="less">
    @import '../../styles/variables.less';
    @import '../../styles/layout.less';

    // Layout doesn't really work below 750px, so say that
    // 'mobile' is anything below that
    @mobile: ~"only screen and (max-width: 750px)";

    ul {
        list-style: none;
        padding: 0;
        display: grid;
        grid-template-columns: 50% 50%;

        @media @mobile {
            grid-template-columns: 100%;
            margin: 0;
        }
    }

    .menu {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1em;

        @media @mobile {
            flex-direction: column;
            align-items: flex-start;
        }

        button {
            @media @mobile {
                margin-bottom: 1em;
            }
        }
    }
</style>
