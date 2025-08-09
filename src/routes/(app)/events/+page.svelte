<script lang="ts">
    import EventsList from '$lib/components/event/EventsList.svelte';
    import { dispatch } from '$lib/dataChangeEvents';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import Select from '$lib/components/ui/Select.svelte';
    import { Event } from '$lib/controllers/event/event';
    import { eventsSortKey, obfuscated } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import type { EventsSortKey } from '../../../types';
    import type { PageData } from './$types';
    import { tryDecryptText, tryEncryptText } from '$lib/utils/encryption.client.js';

    export let data: PageData;

    function sortEvents<T extends Event | EventData>(
        events: T[],
        key: EventsSortKey & keyof T
    ): T[] {
        if (events.length < 2) return events;
        if (key === 'name') {
            return events.sort((a, b) => {
                return tryDecryptText(a[key] as string).localeCompare(
                    tryDecryptText(b[key] as string)
                );
            });
            // everything that isn't 'name' is a number
        } else if (typeof events[0][key] === 'number') {
            return events.sort((a, b) => {
                return (b[key] as number) - (a[key] as number);
            });
        }
        throw new Error('Invalid sort key');
    }

    async function newEvent() {
        const now = nowUtc();
        const name = tryEncryptText(Event.NEW_EVENT_NAME);

        const { id } = notify.onErr(
            await api.post('/events', {
                name,
                start: now,
                end: now,
                tzOffset: currentTzOffset()
            })
        );

        const event: Event = {
            id,
            name,
            start: now,
            end: now,
            tzOffset: currentTzOffset(),
            created: now,
            labelId: null
        };

        await dispatch.create('event', event);
        events = sortEvents([...events, event], $eventsSortKey || 'created');
    }

    type EventData = Event & { deleted?: true };

    let { events } = data;
    $: if ($eventsSortKey) events = sortEvents(events, $eventsSortKey);

    let selectId: string;
    $: selectId =
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

<main>
    <div class="flex justify-between p-2 md:p-4">
        <div>
            <button class="primary flex-center gap-1" on:click={newEvent}>
                <Plus size="30" />
                New Event
            </button>
        </div>

        <div class="flex-center gap-2">
            <span class="text-light">Sort by</span>
            {#if $eventsSortKey !== null}
                <span class="sort-by-select">
                    <Select bind:key={$eventsSortKey} options={sortEventsKeys} />
                </span>
            {:else}
                ...
            {/if}
        </div>
    </div>
    <div class="md:p-4">
        <EventsList labels={data.labels} {events} {selectId} obfuscated={$obfuscated} />
    </div>
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
