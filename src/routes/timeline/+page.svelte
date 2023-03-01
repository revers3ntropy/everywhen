<script lang="ts">
    import { onMount } from 'svelte';
    import type { App } from '../../app';
    import { api } from '../../lib/api/apiQuery';
    import Background from '../../lib/canvas/Background.svelte';
    import Canvas from '../../lib/canvas/Canvas.svelte';
    import { Entry } from '../../lib/controllers/entry';
    import CenterLine from './CenterLine.svelte';
    import Controls from './Controls.svelte';
    import EntryInTimeline from './EntryInTimeline.svelte';
    import NowLine from './NowLine.svelte';
    import TimeCursor from './TimeCursor.svelte';
    import TimeMarkers from './TimeMarkers.svelte';

    export let data: App.PageData;

    let entries: (Entry & { wordCount: number })[] = [];
    let events: Event[] = [];

    onMount(async () => {
        let res = await api.get(data, '/timeline');
        entries = res.entries;
        events = res.events;
    });
</script>

<main>
    <Canvas>
        <Controls />
        <Background />

        <TimeMarkers />
        <CenterLine />

        <NowLine />
        <TimeCursor />

        {#each entries as entry, i}
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