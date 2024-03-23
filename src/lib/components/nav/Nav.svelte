<script lang="ts">
    import { page } from '$app/stores';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
    import MapOutline from 'svelte-material-icons/MapOutline.svelte';
    import Notebook from 'svelte-material-icons/NotebookOutline.svelte';

    const buttonCls =
        'w-full inline-flex px-2 py-3 items-center content-center gap-1 flex-col md:flex-row' +
        ' hover:bg-lightAccent text-textColorLight hover:text-textColor hover:no-underline icon-gradient-on-hover';
</script>

<nav>
    <div class="grid grid-cols-1 grid-rows-3 h-full w-fit">
        <div />

        <div
            class="fixed bottom-0 left-0 w-full h-fit z-50 flex items-center justify-center md:static md:w-fit md:h-full"
        >
            <div
                class="flex-center w-full bg-vLightAccent md:bordered overflow-hidden items-center md:rounded-r-lg md:flex-col border border-solid border-backgroundColor border-l-0"
            >
                <a
                    href="/journal"
                    aria-label="journal"
                    class={buttonCls}
                    class:bg-primaryLight={$page.url.pathname.startsWith('/journal') &&
                        !$page.url.pathname.startsWith('/journal/deleted')}
                    class:hover:bg-primaryLight={$page.url.pathname.startsWith('/journal') &&
                        !$page.url.pathname.startsWith('/journal/deleted')}
                >
                    <Notebook size="30" />
                    <div class="text-sm md:text-base"> Journal </div>
                </a>
                <a
                    href="/timeline"
                    aria-label="timeline"
                    class={buttonCls}
                    class:bg-primaryLight={$page.url.pathname.startsWith('/timeline')}
                    class:hover:bg-primaryLight={$page.url.pathname.startsWith('/timeline')}
                >
                    <ChartTimeline size="30" />
                    <div class="text-sm md:text-base"> Timeline </div>
                </a>
                <a
                    href="/map"
                    aria-label="map"
                    class={buttonCls}
                    class:bg-primaryLight={$page.url.pathname.startsWith('/map')}
                    class:hover:bg-primaryLight={$page.url.pathname.startsWith('/map')}
                >
                    <MapOutline size="30" />
                    <div class="text-sm md:text-base"> Map </div>
                </a>
                <a
                    href="/stats"
                    class={buttonCls}
                    class:bg-primaryLight={$page.url.pathname.startsWith('/stats')}
                    class:hover:bg-primaryLight={$page.url.pathname.startsWith('/stats')}
                    aria-label="insights"
                >
                    <Counter size="30" />
                    <div class="text-sm md:text-base"> Insights </div>
                </a>
                <a
                    href="/journal/deleted"
                    class={buttonCls}
                    class:bg-primaryLight={$page.url.pathname.startsWith('/journal/deleted')}
                    class:hover:bg-primaryLight={$page.url.pathname.startsWith('/journal/deleted')}
                    aria-label="bin"
                >
                    <DeleteOutline size="30" />
                    <div class="text-sm md:text-base"> Bin </div>
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
