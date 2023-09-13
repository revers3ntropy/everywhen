<script lang="ts">
    import { page } from '$app/stores';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import ChevronLeft from 'svelte-material-icons/ChevronLeft.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import TrashCanOutline from 'svelte-material-icons/TrashCanOutline.svelte';
    import MapOutline from 'svelte-material-icons/MapOutline.svelte';
    import Notebook from 'svelte-material-icons/NotebookOutline.svelte';
    import CogOutline from 'svelte-material-icons/CogOutline.svelte';
    import LabelMultipleOutline from 'svelte-material-icons/LabelMultipleOutline.svelte';
    import ImageMultipleOutline from 'svelte-material-icons/ImageMultipleOutline.svelte';
    import CalendarMultiple from 'svelte-material-icons/CalendarMultiple.svelte';
    import ChartMultiple from 'svelte-material-icons/ChartMultiple.svelte';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { navExpanded } from '$lib/stores';
    import { slide } from 'svelte/transition';
</script>

<div class="wrapper" transition:slide={{ duration: ANIMATION_DURATION, axis: 'x' }}>
    <div></div>

    <div>
        <div class="nav-buttons">
            <a
                href="/journal"
                aria-label="journal"
                class="nav-link"
                class:current={$page.url.pathname.startsWith('/journal') &&
                    !$page.url.pathname.startsWith('/journal/deleted')}
            >
                <Notebook size="30" />
                Journal
            </a>
            <span class="nested-nav-links">
                <a
                    href="/assets"
                    class="nav-link"
                    class:current={$page.url.pathname.startsWith('/assets')}
                    aria-label="assets"
                >
                    <ImageMultipleOutline size="25" />
                    <span> Gallery </span>
                </a>
                <a
                    href="/journal/deleted"
                    class="nav-link"
                    class:current={$page.url.pathname.startsWith('/journal/deleted')}
                    aria-label="events"
                >
                    <TrashCanOutline size="25" />
                    <span> Bin </span>
                </a>
            </span>

            <a
                href="/timeline"
                aria-label="timeline"
                class="nav-link"
                class:current={$page.url.pathname.startsWith('/timeline')}
            >
                <ChartTimeline size="30" />
                Timeline
            </a>
            <span class="nested-nav-links">
                <a
                    href="/events"
                    class="nav-link"
                    class:current={$page.url.pathname.startsWith('/events')}
                    aria-label="events"
                >
                    <CalendarMultiple size="25" />
                    <span> Events </span>
                </a>
            </span>

            <a
                href="/map"
                aria-label="map"
                class="nav-link"
                class:current={$page.url.pathname.startsWith('/map')}
            >
                <MapOutline size="30" />
                <span> Map </span>
            </a>
            <a
                href="/stats"
                class="nav-link"
                class:current={$page.url.pathname.startsWith('/stats')}
                aria-label="statistics"
            >
                <Counter size="30" />
                <span> Insights </span>
            </a>
            <a
                href="/datasets"
                class="nav-link"
                class:current={$page.url.pathname.startsWith('/datasets')}
                aria-label="datasets"
            >
                <ChartMultiple size="30" />
                <span> Datasets </span>
            </a>
            <a
                href="/labels"
                class="nav-link"
                class:current={$page.url.pathname.startsWith('/labels')}
                aria-label="labels"
            >
                <LabelMultipleOutline size="30" />
                <span> Labels </span>
            </a>
            <a
                href="/settings"
                class="nav-link"
                class:current={$page.url.pathname.startsWith('/settings')}
                aria-label="settings"
            >
                <CogOutline size="30" />
                <span> Settings </span>
            </a>
        </div>
    </div>

    <div class="flex items-end p-4 justify-center">
        <button on:click={() => ($navExpanded = false)}>
            <ChevronLeft size="30" />
        </button>
    </div>
</div>

<style lang="scss">
    $nav-width: 12rem;

    .wrapper {
        box-shadow: $shadow-light;
        width: $nav-width;
        height: 100%;
        display: grid;
        grid-template-rows: 1fr 1fr 1fr;
        border-right: 1px solid var(--border-color);
        background: var(--nav-bg);
    }

    .nav-buttons {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .nested-nav-links {
            width: calc(100% - 1rem);
            margin-left: 1rem;
            border-left: 1px solid var(--border-color);
        }

        .nav-link {
            width: 100%;
            display: flex;
            flex-direction: row;
            gap: 1rem;
            align-items: center;
            justify-content: flex-start;
            text-decoration: none;
            padding: 0.5rem;
            color: var(--text-color);

            & {
                transition: background $transition;
            }

            &:hover {
                background: var(--light-accent);
            }

            &.current {
                background: var(--primary-light);
                font-weight: 600;
            }
        }
    }
</style>
