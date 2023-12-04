<script lang="ts">
    import { dispatch } from '$lib/dataChangeEvents';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import Select from '$lib/components/Select.svelte';
    import { Event } from '$lib/controllers/event/event';
    import { eventsSortKey, navExpanded, obfuscated } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import EventComponent from '$lib/components/event/Event.svelte';
    import type { EventsSortKey } from '../../../types';
    import type { PageData } from './$types';

    export let data: PageData;

    function sortEvents<T extends Event | EventData>(
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
                return (b[key] as number) - (a[key] as number);
            });
        }
        throw new Error('Invalid sort key');
    }

    async function newEvent() {
        const now = nowUtc();

        const { id } = notify.onErr(
            await api.post('/events', {
                name: Event.NEW_EVENT_NAME,
                start: now,
                end: now,
                tzOffset: currentTzOffset()
            })
        );

        const event: Event = {
            id,
            name: Event.NEW_EVENT_NAME,
            start: now,
            end: now,
            tzOffset: currentTzOffset(),
            created: now,
            label: null
        };

        await dispatch.create('event', event);
        events = sortEvents([...events, event], $eventsSortKey || 'created');
    }

    type EventData = Event & { deleted?: true };

    let { events } = data;
    $: if ($eventsSortKey) events = sortEvents(events, $eventsSortKey);

    let selectNameId: string;
    $: selectNameId =
        events[events.findIndex(e => e.name === Event.NEW_EVENT_NAME && !e.deleted)]?.id || '';

    const sortEventsKeys = {
        created: 'created',
        start: 'start',
        end: 'end',
        name: 'name'
    };
</script>

<svelte:head>
    <title>Events</title>
</svelte:head>

<main class={$navExpanded ? 'md:ml-48' : 'md:ml-16'}>
    <div class="flex justify-between p-2 md:pt-4">
        <div>
            <button class="primary with-icon" on:click={newEvent}>
                <Plus size="30" />
                New Event
            </button>
        </div>

        <div class="flex-center gap-2">
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
                <EventComponent
                    {event}
                    {selectNameId}
                    labels={data.labels}
                    obfuscated={$obfuscated}
                />
            </li>
        {/each}
    </ul>
</main>

<style lang="scss">
    @import '$lib/styles/layout';

    h1 {
        @extend .flex-center;
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
        grid-template-columns: 1fr 1fr;

        @media #{$mobile} {
            grid-template-columns: 1fr;
            margin: 0;
        }

        @media #{$large} {
            grid-template-columns: 1fr 1fr 1fr;
        }
    }

    .sort-by {
        @extend .flex-center;
        padding: 0 0 0 1rem;
        justify-content: flex-end;

        @media #{$mobile} {
            padding: 1rem 0 0 1rem;
            justify-content: flex-start;
        }

        .sort-by-select {
            margin: 0.3rem;
        }
    }
</style>
