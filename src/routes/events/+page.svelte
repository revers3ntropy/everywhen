<script lang="ts">
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { App } from '../../app';
    import { api } from '../../lib/api/apiQuery';
    import type { Event as EventController } from '../../lib/controllers/event';
    import { displayNotifOnErr, nowS } from '../../lib/utils.js';
    import Event from './Event.svelte';

    const NEW_EVENT_NAME = 'New Event';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData & {
        events: EventController[];
    };

    let events = data.events;
    $: events = data.events;

    async function reloadEvents () {
        events = displayNotifOnErr(addNotification,
            await api.get(data, '/events'),
        ).events;
    }

    async function newEvent () {
        displayNotifOnErr(addNotification,
            await api.post(data, '/events', {
                name: NEW_EVENT_NAME,
                start: nowS(),
                end: nowS(),
            }),
        );

        await reloadEvents();
    }

    let eventCount = events.length;
    $: eventCount = events.length;

</script>

<main>
    <h1>Events ({eventCount})</h1>

    <ul>
        {#each events as event}
            <li>
                <Event
                    {event}
                    auth={data}
                    selectName={event.name === NEW_EVENT_NAME}
                    changeEventCount={(by) => eventCount += by}
                />
            </li>
        {/each}
        <li>
            <button
                class="primary unbordered"
                on:click={newEvent}
            >
                <Plus size="30" />
                New Event
            </button>
        </li>
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
        }

        li {
            .bordered();
            margin: .3rem .3em;
            padding: .4em;
            border-radius: 10px;

            &:last-child {
                .flex-center();
                border: none;
            }
        }
    }
</style>
