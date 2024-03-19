<script lang="ts">
    import { page } from '$app/stores';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import MapOutline from 'svelte-material-icons/MapOutline.svelte';
    import Notebook from 'svelte-material-icons/NotebookOutline.svelte';
</script>

<nav>
    <div class="grid grid-cols-1 grid-rows-3 h-full w-fit">
        <div />

        <div
            class="fixed bottom-0 left-0 w-full h-fit z-50 flex items-center justify-center md:static md:w-fit md:h-full"
        >
            <div
                class="flex justify-center w-full bg-vLightAccent md:bordered overflow-hidden items-center md:rounded-r-lg md:flex-col"
            >
                <a
                    href="/journal"
                    aria-label="journal"
                    class="w-full inline-flex items-center justify-center flex-col p-3 hover:bg-lightAccent"
                    class:bg-primaryLight={$page.url.pathname.startsWith('/journal') &&
                        !$page.url.pathname.startsWith('/journal/deleted')}
                    class:hover:bg-primaryLight={$page.url.pathname.startsWith('/journal') &&
                        !$page.url.pathname.startsWith('/journal/deleted')}
                >
                    <Notebook size="30" />
                    Journal
                </a>
                <a
                    href="/timeline"
                    aria-label="timeline"
                    class="w-full inline-flex items-center justify-center flex-col p-3 hover:bg-lightAccent"
                    class:bg-primaryLight={$page.url.pathname.startsWith('/timeline')}
                    class:hover:bg-secondaryLight={$page.url.pathname.startsWith('/timeline')}
                >
                    <ChartTimeline size="30" />
                    Timeline
                </a>
                <a
                    href="/map"
                    aria-label="map"
                    class="w-full inline-flex items-center justify-center flex-col p-3 hover:bg-lightAccent"
                    class:bg-primaryLight={$page.url.pathname.startsWith('/map')}
                    class:hover:bg-secondaryLight={$page.url.pathname.startsWith('/map')}
                >
                    <MapOutline size="30" />
                    Map
                </a>
                <a
                    href="/stats"
                    class="w-full inline-flex items-center justify-center flex-col p-3 hover:bg-lightAccent"
                    class:bg-primaryLight={$page.url.pathname.startsWith('/stats')}
                    class:hover:bg-secondaryLight={$page.url.pathname.startsWith('/stats')}
                    aria-label="statistics"
                >
                    <Counter size="30" />
                    Insights
                </a>
                <a
                    href="/journal/deleted"
                    class="w-full inline-flex items-center justify-center flex-col p-3 hover:bg-lightAccent"
                    class:bg-primaryLight={$page.url.pathname.startsWith('/journal/deleted')}
                    class:hover:bg-secondaryLight={$page.url.pathname.startsWith(
                        '/journal/deleted'
                    )}
                    aria-label="bin"
                >
                    <Counter size="30" />
                    Bin
                </a>
            </div>
        </div>

        <div />
    </div>
</nav>

<style lang="scss">
    $nav-open-width: 12rem;

    nav {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        // increased to 6 so that on mobile the nav buttons are not cut off
        // by entry group titles, and is above top navbar
        z-index: 6;
        height: 100%;
    }
</style>
