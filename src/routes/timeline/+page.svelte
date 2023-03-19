<script lang="ts">
    import { onMount } from 'svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { App } from '../../app';
    import { api } from '../../lib/api/apiQuery';
    import Background from '../../lib/canvas/Background.svelte';
    import Canvas from '../../lib/canvas/Canvas.svelte';
    import type { Entry } from '../../lib/controllers/entry';
    import { Event } from '../../lib/controllers/event';
    import { displayNotifOnErr } from '../../lib/utils/notifications';
    import CenterLine from './CenterLine.svelte';
    import Controls from './Controls.svelte';
    import EntryInTimeline from './EntryInTimeline.svelte';
    import EventInTimeline from './EventInTimeline.svelte';
    import NowLine from './NowLine.svelte';
    import TimeCursor from './TimeCursor.svelte';
    import TimeMarkers from './TimeMarkers.svelte';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData;

    let timeline: {
        entries: (Entry & { wordCount: number })[],
        events: Event[],
    } = {
        entries: [],
        events: [],
    };
    let events: ({ yLevel: number } & Event)[];

    const eventBaseY = 4;

    function updateEvents (rawEvents: Event[]) {
        const evts: (typeof events) = rawEvents.sort((e1, e2) => {
            return Event.duration(e1) - Event.duration(e2);
        }).map(e => ({ ...e, yLevel: 0 }));

        for (const event of evts) {
            if (Event.duration(event) < 60) {
                continue;
            }

            let overlappedLargerEvents = evts.filter(e => {
                return Event.intersects(event, e)
                    && Event.duration(e) > Event.duration(event)
                    && e !== event;
            });

            for (const e of overlappedLargerEvents) {
                e.yLevel = Math.max(e.yLevel, event.yLevel + 1);
            }
        }

        events = evts;
    }

    $: updateEvents(timeline.events);


    onMount(async () => {
        timeline = displayNotifOnErr(addNotification,
            await api.get(data, '/timeline'),
        );
    });
</script>

<svelte:head>
    <title>Timeline</title>
    <meta content="Timeline" name="description" />
</svelte:head>

<main>
    <Canvas>
        <Controls />
        <Background />

        <TimeMarkers />
        <CenterLine />

        <NowLine />
        <TimeCursor />

        {#each timeline.entries as entry, i}
            <EntryInTimeline
                {...entry}
                entryTextParityHeight={i % 2 === 0}
            />
        {/each}

        {#each events as event, i}
            <EventInTimeline
                {...event}
                yLevel={Event.duration(event) < 60
                    ? eventBaseY
                    : eventBaseY + 1 + event.yLevel
                }
                eventTextParityHeight={i % 2 === 0}
            />
        {/each}

    </Canvas>
</main>

<style lang="less">
    // put the canvas behind everything,
    // but filling the screen
    :global(canvas) {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1;
    }

    :global(footer) {
        display: none !important;
    }

    :global(body) {
        max-height: 100vw;
    }
</style>