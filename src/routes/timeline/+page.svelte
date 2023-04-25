<script lang="ts">
    import type { Label } from '../../lib/controllers/label';
    import { onMount } from 'svelte';
    import Background from '../../lib/canvas/Background.svelte';
    import Canvas from '../../lib/canvas/Canvas.svelte';
    import { canvasState } from '../../lib/canvas/canvasState';
    import { Event } from '../../lib/controllers/event';
    import { nowUtc } from '../../lib/utils/time';
    import type { TimelineEntry } from './+page.server';
    import CenterLine from './CenterLine.svelte';
    import Controls from './Controls.svelte';
    import EntryInTimeline from './EntryInTimeline.svelte';
    import EventInTimeline from './EventInTimeline.svelte';
    import NowLine from './NowLine.svelte';
    import TimeCursor from './TimeCursor.svelte';
    import TimeMarkers from './TimeMarkers.svelte';
    import { addYToEvents, type EventWithYLevel } from './utils';

    export let data: App.PageData & {
        entries: TimelineEntry[];
        events: Event[];
        labels: Label[];
    };

    let events: EventWithYLevel[];

    const eventBaseY = 4;

    $: events = addYToEvents(data.events);

    function setInitialZoomAndPos() {
        const earliestTimestamp = Math.min(
            ...data.entries.map(e => e.created),
            ...data.events.map(e => e.start)
        );
        const earliestTimestampTimeAgo = nowUtc() - earliestTimestamp;
        const daysAgo = Math.round(
            Math.min(52, Math.max(earliestTimestampTimeAgo / (60 * 60 * 24), 0))
        );

        // zoom so that there is 1 day of blank space to the left
        // of the last entry/event,
        // except if it is more than 52 days ago,
        // then show 53 days
        $canvasState.zoom = 1 / 60 / (daysAgo + 1);

        $canvasState.cameraOffset =
            $canvasState.timeToRenderPos(nowUtc()) -
            ($canvasState.width * 3) / 4;
    }

    onMount(setInitialZoomAndPos);

    onMount(() => (document.title = 'Timeline'));
</script>

<svelte:head>
    <title>Timeline</title>
    <meta content="Timeline" name="description" />

    <style lang="less">
        /*
            put the style here because the styles should all be global,
            however when switching pages the styles get leaked and cause
            weird issues (the bar chart not showing on the stats page)
         */
        @import '../../styles/variables';

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

        nav {
            // make navbar visible when hovering to stop unexpected
            // behaviour when hovering on navbar
            transition: background-color @transition;

            &:hover {
                background-color: @header-bg;
            }
        }
    </style>
</svelte:head>

<main>
    <Canvas>
        <Controls />
        <Background />

        <TimeMarkers startYear="{data.settings.yearOfBirth.value}" />

        <NowLine />

        {#each data.entries as entry, i}
            <EntryInTimeline
                {...entry}
                entryTextParityHeight="{i % 2 === 0}"
                auth="{data}"
            />
        {/each}

        {#each events as event, i}
            <EventInTimeline
                auth="{data}"
                labels="{data.labels}"
                {...event}
                yLevel="{Event.duration(event) < 60
                    ? eventBaseY
                    : eventBaseY + 1 + event.yLevel}"
                eventTextParityHeight="{i % 2 === 0}"
            />
        {/each}

        <CenterLine />
        <TimeCursor />
    </Canvas>
</main>
