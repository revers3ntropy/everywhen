<script lang="ts">
    import type { Label } from '$lib/controllers/label';
    import { onMount } from 'svelte';
    import Background from '$lib/canvas/Background.svelte';
    import Canvas from '$lib/canvas/Canvas.svelte';
    import { canvasState } from '$lib/canvas/canvasState';
    import type { Event } from '$lib/controllers/event';
    import { nowUtc } from '$lib/utils/time';
    import type { TimelineEntry } from './+page.server';
    import CenterLine from './CenterLine.svelte';
    import Controls from './Controls.svelte';
    import EntryInTimeline from './EntryInTimeline.svelte';
    import EventInTimeline from './EventInTimeline.svelte';
    import NowLine from './NowLine.svelte';
    import TimeCursor from './TimeCursor.svelte';
    import ContextMenu from './ContextMenu.svelte';
    import TimeMarkers from './TimeMarkers.svelte';
    import {
        addYToEvents,
        type EventWithYLevel,
        getInitialZoomAndPos
    } from './utils';

    export let data: App.PageData & {
        entries: TimelineEntry[];
        events: Event[];
        labels: Label[];
    };

    let events: EventWithYLevel[];

    $: events = addYToEvents(data.events);

    onMount(() => {
        const [zoom, offset] = getInitialZoomAndPos(
            $canvasState,
            data.entries,
            data.events
        );
        $canvasState.zoom = zoom;
        $canvasState.cameraOffset = offset;
    });

    function onUpdateEvents() {
        data.events = [...data.events];
    }

    function onCreateEvent(event: Event) {
        data.events.push(event);
        onUpdateEvents();
    }

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
                background-color: @light-v-accent;
            }
        }
    </style>
</svelte:head>

<main>
    <Canvas>
        <Controls />
        <Background />
        <ContextMenu auth={data} {onCreateEvent} />

        <TimeMarkers startYear={data.settings.yearOfBirth.value} />

        <NowLine />

        {#each data.entries as entry, i}
            <EntryInTimeline
                {...entry}
                entryTextParityHeight={i % 2 === 0}
                auth={data}
                hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
            />
        {/each}

        {#each events as event, i}
            <EventInTimeline
                auth={data}
                labels={data.labels}
                {...event}
                yLevel={1 + event.yLevel}
                eventTextParityHeight={i % 2 === 0}
            />
        {/each}

        <CenterLine />
        <TimeCursor auth={data} {onCreateEvent} />
    </Canvas>
</main>
