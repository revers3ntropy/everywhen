<script lang="ts">
    import Canvas from "../../lib/canvas/Canvas.svelte";
    import Background from "../../lib/canvas/Background.svelte";
    import { onMount } from "svelte";
    import type { Auth, Entry } from "../../lib/types";
    import { api } from "../../lib/api/apiQuery";
    import EntryInTimeline from "./EntryInTimeline.svelte";
    import TimeMarkers from "./TimeMarkers.svelte";
    import NowLine from "./NowLine.svelte";
    import TimeCursor from "./TimeCursor.svelte";
    import CenterLine from "./CenterLine.svelte";
    import { cameraOffset, props, renderable } from "../../lib/canvas/canvas";
    import Controls from "./Controls.svelte";

    export let data: Auth;

    let entries: Entry[] = [];
    onMount(async () => {
        entries = (await api.get(data, "/entries/titles")).entries;
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

        {#each entries as entry}
            <EntryInTimeline {...entry} />
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