<script lang="ts">
    import { onMount } from 'svelte';
    import Background from '../../lib/canvas/Background.svelte';
    import { canvasState } from '../../lib/canvas/canvas';
    import Canvas from '../../lib/canvas/Canvas.svelte';
    import type { Entry } from '../../lib/controllers/entry';
    import { Event } from '../../lib/controllers/event';
    import { nowS } from '../../lib/utils/time';
    import CenterLine from './CenterLine.svelte';
    import Controls from './Controls.svelte';
    import EntryInTimeline from './EntryInTimeline.svelte';
    import EventInTimeline from './EventInTimeline.svelte';
    import NowLine from './NowLine.svelte';
    import TimeCursor from './TimeCursor.svelte';
    import TimeMarkers from './TimeMarkers.svelte';

    export let data: App.PageData & {
        entries: (Entry & { wordCount: number })[],
        events: Event[],
    };

    let events: ({ yLevel: number } & Event)[];

    const eventBaseY = 4;

    function addYToEvents (
        rawEvents: Event[],
    ): ({ yLevel: number } & Event)[] {
        const evts: (typeof events) = rawEvents.sort((e1, e2) => {
            return Event.duration(e1) - Event.duration(e2);
        }).map(e => ({ ...e, yLevel: 0 }));

        for (const event of evts) {
            if (Event.isInstantEvent(event)) {
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

        return evts;
    }

    $: events = addYToEvents(data.events);

    function setInitialZoomAndPos () {
        const earliestTimestamp = Math.min(
            ...data.entries.map(e => e.created),
            ...data.events.map(e => e.start),
        );
        const earliestTimestampTimeAgo = nowS() - earliestTimestamp;
        const daysAgo = Math.round(Math.min(
            52,
            Math.max(
                earliestTimestampTimeAgo / (60 * 60 * 24),
                0,
            ),
        ));

        // zoom so that there is 1 day of blank space to the left
        // of the last entry/event,
        // except if it is more than 52 days ago,
        // then show 59 days

        $canvasState.zoom = 1 / 60 / (daysAgo + 1);

        $canvasState.cameraOffset = 24;
    }

    onMount(setInitialZoomAndPos);

    onMount(() => document.title = 'Timeline');

</script>

<svelte:head>
    <title>Timeline</title>
    <meta content="Timeline" name="description" />

    <!-- put the style here because the styles should all be global,
        however when switching pages the styles get leaked and cause
        weird issues (the bar chart not showing on the stats page) -->
    <style>
        /*
            put the canvas behind everything,
            but filling the screen
        */
        canvas {
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1;
        }

        footer {
            display: none !important;
        }

        body {
            max-height: 100vw;
        }
    </style>
</svelte:head>

<main>
    <Canvas>
        <Controls />
        <Background />

        <TimeMarkers
            startYear={data.settings.yearOfBirth.value}
        />

        <NowLine />

        {#each data.entries as entry, i}
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

        <CenterLine />
        <TimeCursor />
    </Canvas>
</main>