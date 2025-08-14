<script lang="ts">
    import FpsCounter from '$lib/components/canvas/FpsCounter.svelte';
    import { listen } from '$lib/dataChangeEvents';
    import { onMount } from 'svelte';
    import Background from '$lib/components/canvas/Background.svelte';
    import Canvas from '$lib/components/canvas/Canvas.svelte';
    import { canvasState } from '$lib/components/canvas/canvasState';
    import CenterLine from './CenterLine.svelte';
    import Controls from './Controls.svelte';
    import EntriesInTimeline from './EntriesInTimeline.svelte';
    import EventInTimeline from './EventInTimeline.svelte';
    import Filters from './Filters.svelte';
    import MobileZoom from './MobileZoom.svelte';
    import NewEventButton from './NewEventButton.svelte';
    import NowLine from './NowLine.svelte';
    import TimeCursor from './TimeCursor.svelte';
    import TimeMarkers from './TimeMarkers.svelte';
    import { addYToEvents, type EventWithYLevel, getInitialZoomAndPos } from './utils';
    import type { PageData } from './$types';
    import { settingsStore } from '$lib/stores';

    export let data: PageData;

    let { labels, events, entries } = data;

    let selectedLabels = [...Object.keys(labels), ''];

    let instantEvents: EventWithYLevel[];
    let durationEvents: EventWithYLevel[];
    $: [instantEvents, durationEvents] = addYToEvents(
        events.filter(event => selectedLabels.includes(event.labelId || ''))
    );

    onMount(() => {
        const [zoom, offset] = getInitialZoomAndPos($canvasState, entries, events);
        $canvasState.zoom = zoom;
        $canvasState.cameraOffset = offset;
    });

    listen.event.onCreate(event => {
        events = [...events, event];
    });
    listen.event.onDelete(id => {
        events = [...events.filter(e => e.id !== id)];
    });
    listen.event.onUpdate(changedEvent => {
        events = [...events.filter(e => e.id !== changedEvent.id), changedEvent];
    });
    listen.entry.onDelete(id => {
        entries = [...entries.filter(e => e.id !== id)];
    });
    listen.label.onCreate(label => {
        labels[label.id] = label;
        selectedLabels = [...selectedLabels, label.id];
    });
    listen.label.onUpdate(label => {
        labels[label.id] = label;
    });
    listen.label.onDelete(id => {
        delete labels[id];
    });
</script>

<svelte:head>
    <title>Timeline</title>

    <style lang="scss">
        /*
            put the style here because the styles should all be global,
            however when switching pages the styles get leaked and cause
            weird issues (the bar chart not showing on the stats page)
         */

        /*
            put the canvas behind everything,
            but filling the screen
        */
        canvas {
            position: fixed;
            top: 0;
            left: 6rem;
            z-index: 1;
        }

        @media #{$mobile} {
            canvas {
                left: 0;
            }
        }

        footer {
            display: none !important;
        }

        body,
        .root {
            max-height: 100vh;

            &::-webkit-scrollbar {
                display: none;
            }
        }
    </style>
</svelte:head>

<main>
    <Canvas>
        <Controls />
        <MobileZoom />
        <Background />

        <TimeMarkers startYear={$settingsStore.yearOfBirth.value} />

        <NowLine />

        <EntriesInTimeline {entries} selectedLabelIds={selectedLabels} {labels} />

        {#key instantEvents}
            {#key durationEvents}
                {#each durationEvents as event (event.id)}
                    <EventInTimeline
                        {labels}
                        {...event}
                        yLevel={1 + event.yLevel}
                        eventTextParityHeight
                    />
                {/each}
                {#each instantEvents as event, i (event.id)}
                    <EventInTimeline {labels} {...event} eventTextParityHeight={i % 2 === 0} />
                {/each}
            {/key}
        {/key}

        <CenterLine />
        <TimeCursor {labels} />

        <FpsCounter />
    </Canvas>

    <Filters labels={data.labels} bind:selectedLabels />
    <NewEventButton {labels} />
</main>
