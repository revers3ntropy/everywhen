<script lang="ts">
    import { dispatch } from '$lib/dataChangeEvents';
    import { onMount } from 'svelte';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import Dot from '$lib/components/Dot.svelte';
    import Select from '$lib/components/Select.svelte';
    import { Event as EventController } from '$lib/controllers/event/event';
    import { eventsSortKey, obfuscated } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import { nowUtc } from '$lib/utils/time';
    import Event from '$lib/components/event/Event.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

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
                return (b[key] as number) - <number>a[key];
            });
        }
        throw new Error('Invalid sort key');
    }

    async function newEvent() {
        const now = nowUtc();

        const { id } = displayNotifOnErr(
            await api.post(data.auth, '/events', {
                name: EventController.NEW_EVENT_NAME,
                start: now,
                end: now
            })
        );

        const event = {
            id,
            name: EventController.NEW_EVENT_NAME,
            start: now,
            end: now,
            created: now
        };

        await dispatch.create('event', event);
        events = sortEvents([...events, event], $eventsSortKey || 'created');
    }

    type EventData = EventController & { deleted?: true };

    let events: EventData[] = data.events;
    $: if ($eventsSortKey) events = sortEvents(events, $eventsSortKey);

    let eventCount: number;
    $: eventCount = events.filter(e => !e.deleted).length;

    let selectNameId: string;
    $: selectNameId =
        events[events.findIndex(e => e.name === EventController.NEW_EVENT_NAME && !e.deleted)]
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
        <div>
            <button class="primary with-icon" on:click={newEvent}>
                <Plus size="30" />
                New Event
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

        <div class="sort-by">
            <span class="text-light">Sort by</span>
            {#if $eventsSortKey !== null}
                <span class="sort-by-select">
                    <Select bind:key={$eventsSortKey} options={sortEventsKeys} fromRight />
                </span>
            {:else}
                ...
            {/if}
        </div>
    </div>
    <ul>
        {#each events as event}
            <li>
                <Event
                    {event}
                    auth={data.auth}
                    {selectNameId}
                    labels={data.labels}
                    obfuscated={$obfuscated}
                />
            </li>
        {/each}
    </ul>
</main>

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/layout';

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

        @media @large {
            grid-template-columns: 33% 33% 33%;
        }
    }

    .menu {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        margin-bottom: 1em;

        @media @mobile {
            display: block;
        }

        button {
            margin: 0 1rem 0 0;
            @media @mobile {
                margin-bottom: 1em;
            }
        }
    }

    .sort-by {
        .flex-center();
        padding: 0 0 0 1rem;
        justify-content: end;

        @media @mobile {
            padding: 1rem 0 0 1rem;
            justify-content: start;
        }

        .sort-by-select {
            margin: 0.3rem;
        }
    }
</style>
