<script lang="ts">
    import { notify } from '$lib/notifications/notifications';
    import { onMount } from 'svelte';
    import Background from '$lib/canvas/Background.svelte';
    import Canvas from '$lib/canvas/Canvas.svelte';
    import { canvasState } from '$lib/canvas/canvasState';
    import type { Event } from '$lib/controllers/event';
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
    import type { PageData } from './$types';

    export let data: PageData;

    let instantEvents: EventWithYLevel[];
    let durationEvents: EventWithYLevel[];
    $: [instantEvents, durationEvents] = addYToEvents(data.events);

    onMount(() => {
        const [zoom, offset] = getInitialZoomAndPos(
            $canvasState,
            data.entries,
            data.events
        );
        $canvasState.zoom = zoom;
        $canvasState.cameraOffset = offset;
    });

    function createEvent(event: Event): void {
        data.events = [...data.events, event];
    }

    function updateEvent(event: Event): void {
        const index = data.events.findIndex(e => e.id === event.id);
        if (index === -1) {
            notify.error('Event not found');
            return;
        }
        data.events = [
            ...data.events.slice(0, index),
            event,
            ...data.events.slice(index + 1)
        ];
    }

    function deleteEvent(id: string): void {
        const index = data.events.findIndex(e => e.id === id);
        if (index === -1) {
            notify.error('Event not found');
            return;
        }
        data.events = [
            ...data.events.slice(0, index),
            ...data.events.slice(index + 1)
        ];
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
        <ContextMenu auth={data} {createEvent} />

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

        {#key instantEvents}
            {#key durationEvents}
                {#each durationEvents as event (event.id)}
                    <EventInTimeline
                        auth={data}
                        labels={data.labels}
                        {...event}
                        yLevel={1 + event.yLevel}
                        eventTextParityHeight
                        {updateEvent}
                        {deleteEvent}
                        {createEvent}
                    />
                {/each}
                {#each instantEvents as event, i (event.id)}
                    <EventInTimeline
                        auth={data}
                        labels={data.labels}
                        {...event}
                        eventTextParityHeight={i % 2 === 0}
                        {updateEvent}
                        {deleteEvent}
                        {createEvent}
                    />
                {/each}
            {/key}
        {/key}

        <CenterLine />
        <TimeCursor auth={data} {createEvent} />
    </Canvas>
</main>
