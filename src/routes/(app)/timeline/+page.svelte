<script lang="ts">
    import { listen } from '$lib/dataChangeEvents';
    import { onMount } from 'svelte';
    import Background from '$lib/components/canvas/Background.svelte';
    import Canvas from '$lib/components/canvas/Canvas.svelte';
    import { canvasState } from '$lib/components/canvas/canvasState';
    import CenterLine from './CenterLine.svelte';
    import Controls from './Controls.svelte';
    import EntryInTimeline from './EntryInTimeline.svelte';
    import EventInTimeline from './EventInTimeline.svelte';
    import Filters from './Filters.svelte';
    import MobileZoom from './MobileZoom.svelte';
    import NewEventButton from './NewEventButton.svelte';
    import NowLine from './NowLine.svelte';
    import TimeCursor from './TimeCursor.svelte';
    import TimeMarkers from './TimeMarkers.svelte';
    import { addYToEvents, type EventWithYLevel, getInitialZoomAndPos } from './utils';
    import type { PageData } from './$types';
    import { renderable } from "$lib/components/canvas/renderable";

    export let data: PageData;

    let selectedLabels = [...(data.labels.map(l => l.id) || []), ''];

    let instantEvents: EventWithYLevel[];
    let durationEvents: EventWithYLevel[];
    $: [instantEvents, durationEvents] = addYToEvents(
        data.events.filter(event => selectedLabels.includes(event.label?.id || ''))
    );

    onMount(() => {
        document.title = 'Timeline';

        const [zoom, offset] = getInitialZoomAndPos($canvasState, data.entries, data.events);
        $canvasState.zoom = zoom;
        $canvasState.cameraOffset = offset;
    });

    listen.event.onCreate(event => {
        data.events = [...data.events, event];
    });
    listen.event.onDelete(id => {
        data = {
            ...data,
            events: [...data.events.filter(event => event.id !== id)]
        };
    });
    listen.event.onUpdate(changedEvent => {
        data = {
            ...data,
            events: [...data.events.filter(event => event.id !== changedEvent.id), changedEvent]
        };
    });
    listen.entry.onDelete(id => {
        data = {
            ...data,
            entries: [...data.entries.filter(e => e.id !== id)]
        };
    });
    listen.label.onCreate(label => {
        data = {
            ...data,
            labels: [...(data.labels || []), label]
        };
    });
    listen.label.onUpdate(label => {
        data = {
            ...data,
            labels: data.labels.map(l => (l.id === label.id ? label : l))
        };
    });
    listen.label.onDelete(id => {
        data = {
            ...data,
            labels: data.labels.filter(l => l.id !== id)
        };
    });
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
        @import '../../../styles/variables';

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

        body,
        .root {
            max-height: 100vh;

            &::-webkit-scrollbar {
                display: none;
            }
        }

        nav {
            // make navbar visible when hovering to stop unexpected
            // behaviour when hovering on navbar
            transition: background-color @transition;

            &:hover {
                background-color: var(--v-light-accent);
            }
        }
    </style>
</svelte:head>

<main>
    <Canvas>
        <Controls auth={data.auth} labels={data.labels} />
        <MobileZoom auth={data.auth} labels={data.labels} />
        <Background />

        <TimeMarkers startYear={data.settings.yearOfBirth.value} />

        <NowLine />

        {#each data.entries as entry, i}
            {#if selectedLabels.includes(entry.label?.id || '')}
                <EntryInTimeline
                    {...entry}
                    entryTextParityHeight={i % 2 === 0}
                    auth={data.auth}
                    hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
                />
            {/if}
        {/each}

        {#key instantEvents}
            {#key durationEvents}
                {#each durationEvents as event (event.id)}
                    <EventInTimeline
                        auth={data.auth}
                        labels={data.labels}
                        {...event}
                        yLevel={1 + event.yLevel}
                        eventTextParityHeight
                    />
                {/each}
                {#each instantEvents as event, i (event.id)}
                    <EventInTimeline
                        auth={data.auth}
                        labels={data.labels}
                        {...event}
                        eventTextParityHeight={i % 2 === 0}
                    />
                {/each}
            {/key}
        {/key}

        <CenterLine />
        <TimeCursor auth={data.auth} labels={data.labels} />
    </Canvas>

    <Filters auth={data.auth} labels={data.labels} bind:selectedLabels />
    <NewEventButton auth={data.auth} labels={data.labels} />
</main>
