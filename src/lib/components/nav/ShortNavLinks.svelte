<script lang="ts">
    import { page } from '$app/stores';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import MapOutline from 'svelte-material-icons/MapOutline.svelte';
    import Notebook from 'svelte-material-icons/NotebookOutline.svelte';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
</script>

<a
    href="/journal"
    aria-label="journal"
    class="inline-flex items-center justify-center p-3 hover:bg-lightAccent"
    class:bg-primaryLight={$page.url.pathname.startsWith('/journal')}
>
    <Notebook size="30" />
</a>
<a
    href="/timeline"
    aria-label="timeline"
    class="inline-flex items-center justify-center p-3 hover:bg-lightAccent"
    class:bg-primaryLight={$page.url.pathname.startsWith('/timeline')}
>
    <ChartTimeline size="30" />
</a>
<a
    href="/map"
    aria-label="map"
    class="inline-flex items-center justify-center p-3 hover:bg-lightAccent"
    class:bg-primaryLight={$page.url.pathname.startsWith('/map')}
>
    <MapOutline size="30" />
</a>
<a
    href="/stats"
    class="inline-flex items-center justify-center p-3 hover:bg-lightAccent"
    class:bg-primaryLight={$page.url.pathname.startsWith('/stats')}
    aria-label="statistics"
>
    <Counter size="30" />
</a>
