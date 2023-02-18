<script lang="ts">
    import Canvas from "$lib/canvas/Canvas.svelte";
    import Background from "$lib/canvas/Background.svelte";
    import { onMount } from "svelte";
    import type { Auth, Entry } from "$lib/types";
    import { api } from "$lib/api/apiQuery";
    import EntryInTimeline from "./EntryInTimeline.svelte";
    import TimeMarkers from "./TimeMarkers.svelte";

    export let data: Auth;

    let entries: Entry[] = [];
    onMount(async () => {
        entries = (await api.get(data, "/entries/titles")).entries;
    });
</script>

<main>
    <Canvas>
        <Background color="hsl(0, 0%, 10%)">
        </Background>

        <TimeMarkers />

        {#each entries as entry}
            <EntryInTimeline {...entry} />
        {/each}
    </Canvas>
</main>

<style>
    main {
        margin: 0;
        padding: 0;
    }
</style>