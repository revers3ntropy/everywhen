<script lang="ts">
    import Canvas from "../../lib/canvas/Canvas.svelte";
    import Background from "../../lib/canvas/Background.svelte";
    import { onMount } from "svelte";
    import type { Auth, Entry, Event } from "../../lib/types";
    import { api } from "../../lib/api/apiQuery";
    import EntryInTimeline from "./EntryInTimeline.svelte";
    import TimeMarkers from "./TimeMarkers.svelte";
    import NowLine from "./NowLine.svelte";
    import TimeCursor from "./TimeCursor.svelte";
    import CenterLine from "./CenterLine.svelte";
    import Controls from "./Controls.svelte";

    export let data: Auth;

    let entries: (Entry & { wordCount: number })[] = [];
    let events: Event[] = [];

    onMount(async () => {
        let res = await api.get(data, "/timeline");
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