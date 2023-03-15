<script lang="ts">
    import type { NonFunctionProperties } from '$lib/utils.js';
    import { onMount } from 'svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { App } from '../../app';
    import { api } from '../../lib/api/apiQuery';
    import Background from '../../lib/canvas/Background.svelte';
    import Canvas from '../../lib/canvas/Canvas.svelte';
    import type { Entry } from '../../lib/controllers/entry';
    import type { Event } from '../../lib/controllers/event';
    import { displayNotifOnErr } from '../../lib/utils';
    import CenterLine from './CenterLine.svelte';
    import Controls from './Controls.svelte';
    import EntryInTimeline from './EntryInTimeline.svelte';
    import NowLine from './NowLine.svelte';
    import TimeCursor from './TimeCursor.svelte';
    import TimeMarkers from './TimeMarkers.svelte';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData;

    let timeline: {
        entries: (NonFunctionProperties<Entry> & { wordCount: number })[],
        events: NonFunctionProperties<Event>[],
    } = {
        entries: [],
        events: [],
    };
    let events: Event[] = [];

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
</style>