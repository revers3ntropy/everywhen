<script lang="ts">
    import { onMount } from 'svelte';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import TrayArrowUp from 'svelte-material-icons/TrayArrowUp.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { App } from '../../app';
    import ImportDialog from '../../lib/components/dialogs/ImportDialog.svelte';
    import Dot from '../../lib/components/Dot.svelte';
    import Select from '../../lib/components/Select.svelte';
    import type { Event as EventController } from '../../lib/controllers/event';
    import type { Label } from '../../lib/controllers/label';
    import { eventsSortKey, obfuscated } from '../../lib/stores';
    import { api } from '../../lib/utils/apiRequest';
    import { displayNotifOnErr } from '../../lib/utils/notifications';
    import { showPopup } from '../../lib/utils/popups';
    import { nowUtc } from '../../lib/utils/time';
    import type { EventsSortKey } from '../../lib/utils/types';
    import Event from '../../lib/components/Event.svelte';

    const NEW_EVENT_NAME = 'New Event';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData & {
        events: EventController[];
        labels: Label[];
    };

    type EventData = EventController & { deleted?: true };

    let events: EventData[] = data.events;

    function sortEvents<T extends EventController | EventData>(
        events: T[],
        key: EventsSortKey & keyof T
    ): T[] {
        if (events.length === 0) return [];
        if (typeof events[0][key] === 'string') {
            return events.sort((a, b) => {
                return (a[key] as string).localeCompare(b[key] as string);
            });
        } else if (typeof events[0][key] === 'number') {
            return events.sort((a, b) => {
                return b[key] as number - <number>a[key];
            });
        }
        throw new Error('Invalid sort key');
    }

    async function reloadEvents() {
        events = sortEvents(
            displayNotifOnErr(addNotification, await api.get(data, '/events'))
                .events,
            $eventsSortKey
        );
    }

    $: events = sortEvents(events, $eventsSortKey);

    async function newEvent() {
        const now = nowUtc();
        displayNotifOnErr(
            addNotification,
            await api.post(data, '/events', {
                name: NEW_EVENT_NAME,
                start: now,
                end: now
            })
        );

        await reloadEvents();
    }

    async function handleDeleteEvent({
        detail: event
    }: CustomEvent<EventController>) {
        await reloadEvents();

        const deletedEvent: EventData = {
            ...event,
            deleted: true
        };

        events = [...events, deletedEvent].sort(
            (a, b) => b.created - a.created
        );
    }

    function importPopup() {
        showPopup(
            ImportDialog,
            {
                auth: data,
                type: 'events'
            },
            reloadEvents
        );
    }

    function changeEventCount(by: number) {
        eventCount += by;
    }

    let eventCount: number;
    $: eventCount = events.filter(e => !e.deleted).length;

    let selectNameId: string;
    $: selectNameId =
        events[events.findIndex(e => e.name === NEW_EVENT_NAME && !e.deleted)]
            ?.id || '';

    const sortEventsKeys = {
        created: 'created',
        start: 'start',
        end: 'end',
        name: 'name'
    };

    onMount(() => (document.title = `Events`));
</script>

<svelte:head>
    <title>Events</title>
    <meta content="Events" name="description" />
</svelte:head>

<main>
    <div class="menu">
        <div class="flex-center">
            <button class="primary with-icon" on:click="{newEvent}">
                <Plus size="30" />
                New Event
            </button>
            <button
                class="with-icon icon-gradient-on-hover"
                on:click="{importPopup}"
            >
                <TrayArrowUp size="30" />
                Import
            </button>
        </div>

        <h1>
            <Calendar size="40" />
            <span>
                Events
                {#if eventCount > 0}
                    <Dot />
                    {eventCount}
                {/if}
            </span>
        </h1>

        <div class="flex-center">
            Sort by
            <Select bind:key="{$eventsSortKey}" options="{sortEventsKeys}" />
        </div>
    </div>
    <ul>
        {#each events as event}
            <li>
                <Event
                    event="{event}"
                    auth="{data}"
                    selectNameId="{selectNameId}"
                    changeEventCount="{changeEventCount}"
                    on:update="{reloadEvents}"
                    on:delete="{handleDeleteEvent}"
                    labels="{data.labels}"
                    obfuscated="{$obfuscated}"
                />
            </li>
        {/each}
    </ul>
</main>

<style lang="less">
    @import '../../styles/variables';
    @import '../../styles/layout';

    // Layout doesn't really work below 750px, so say that
    // 'mobile' is anything below that
    @mobile: ~'only screen and (max-width: 750px)';

    h1 {
        .flex-center();
        margin: 0;
        font-size: 40px;

        i {
            font-size: 0.5em;
            margin-left: 0.5em;
        }

        span {
            margin-left: 0.2em;
        }
    }

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
