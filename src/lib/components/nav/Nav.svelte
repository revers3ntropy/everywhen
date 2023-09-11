<script lang="ts">
    import { page } from '$app/stores';
    import CreateNewButton from '$lib/components/nav/CreateNewButton.svelte';
    import { tooltip } from '@svelte-plugins/tooltips';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import ChevronUp from 'svelte-material-icons/ChevronUp.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import TrashCanOutline from 'svelte-material-icons/TrashCanOutline.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import Lock from 'svelte-material-icons/Lock.svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import MapMarkerOutline from 'svelte-material-icons/MapMarkerOutline.svelte';
    import Notebook from 'svelte-material-icons/NotebookOutline.svelte';
    import LightTheme from 'svelte-material-icons/WhiteBalanceSunny.svelte';
    import DarkTheme from 'svelte-material-icons/WeatherNight.svelte';
    import Dropdown from '$lib/components/Dropdown.svelte';
    import CogOutline from 'svelte-material-icons/CogOutline.svelte';
    import Streaks from '$lib/components/Streaks.svelte';
    import LabelMultipleOutline from 'svelte-material-icons/LabelMultipleOutline.svelte';
    import ImageMultipleOutline from 'svelte-material-icons/ImageMultipleOutline.svelte';
    import CalendarMultiple from 'svelte-material-icons/CalendarMultiple.svelte';
    import ChartMultiple from 'svelte-material-icons/ChartMultiple.svelte';
    import { ANIMATION_DURATION, Theme } from '$lib/constants';
    import { obfuscated, passcodeLastEntered, settingsStore, theme, username } from '$lib/stores';
    import { Auth } from '$lib/controllers/auth/auth';
    import { slide } from 'svelte/transition';

    function lock() {
        passcodeLastEntered.set(0);
    }

    function switchTheme() {
        theme.set($theme === Theme.light ? Theme.dark : Theme.light);
    }
</script>

<nav>
    <div>
        <div class="flex md:flex-col">
            <Dropdown width="200px">
                <div class="account-button" slot="button">
                    <p> {$username || '...'} </p>
                    <Streaks condensed />
                    <ChevronDown />
                </div>

                <div class="account-dropdown-options">
                    <Streaks />

                    <hr />

                    <button class="account-dropdown-button" on:click={switchTheme}>
                        {#if $theme === Theme.light}
                            <DarkTheme size="30" />
                            Dark Mode
                        {:else}
                            <LightTheme size="30" />
                            Light Mode
                        {/if}
                    </button>

                    <a aria-label="settings" class="account-dropdown-button" href="/settings">
                        <CogOutline size="30" />
                        Settings
                    </a>

                    <button
                        aria-label="log out"
                        class="account-dropdown-button danger"
                        on:click={() => void Auth.logOut()}
                    >
                        <Logout size="30" />
                        Log Out
                    </button>
                </div>
            </Dropdown>

            <div class="w-fit h-fit px-2 py-1 md:px-4 md:py-3">
                <CreateNewButton />
            </div>

            <div class="p-2 md:py-2 md:mx-2">
                <button
                    class="text-xs flex flex-col content-center items-center md:flex-row md:text-base md:gap-2"
                    aria-label={$obfuscated ? 'Show all' : 'Hide all'}
                    on:click={() => obfuscated.set(!$obfuscated)}
                >
                    {#if $obfuscated}
                        <Eye size="25" />
                        Show all
                    {:else}
                        <EyeOff size="25" />
                        Hide all
                    {/if}
                </button>
            </div>

            {#if $settingsStore.passcode.value}
                <button
                    on:click={lock}
                    class="danger lock-button"
                    use:tooltip={{
                        content: '<span class="oneline">Lock (require passcode)</span>',
                        position: 'bottom'
                    }}
                    aria-label="Lock"
                >
                    <Lock size="25" />
                </button>
            {/if}
        </div>

        <hr class="py-3 mt-3 m-0 w-full hide-mobile" />

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
                {#if $page.url.pathname.startsWith('/journal')}
                    <ChevronUp />
                {:else}
                    <ChevronDown />
                {/if}
            </a>
            {#if $page.url.pathname.startsWith('/journal') || $page.url.pathname.startsWith('/assets')}
                <span transition:slide={{ duration: ANIMATION_DURATION }} class="nested-nav-links">
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
            {/if}

            <a
                href="/timeline"
                aria-label="timeline"
                class="nav-link"
                class:current={$page.url.pathname.startsWith('/timeline')}
            >
                <ChartTimeline size="30" />
                Timeline
                {#if $page.url.pathname.startsWith('/timeline')}
                    <ChevronUp />
                {:else}
                    <ChevronDown />
                {/if}
            </a>
            {#if $page.url.pathname.startsWith('/timeline') || $page.url.pathname.startsWith('/events')}
                <span transition:slide={{ duration: ANIMATION_DURATION }} class="nested-nav-links">
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
            {/if}

            <a
                href="/map"
                aria-label="map"
                class="nav-link"
                class:current={$page.url.pathname.startsWith('/map')}
            >
                <MapMarkerOutline size="30" />
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
                class="nav-link hide-mobile"
                class:current={$page.url.pathname.startsWith('/settings')}
                aria-label="settings"
            >
                <CogOutline size="30" />
                <span> Settings </span>
            </a>
        </div>
    </div>

    <div></div>

    <div class="text-2xl tracking-wide text-center flex justify-center items-end hide-mobile">
        <p class="serif pb-2">Everywhen</p>
    </div>
</nav>

<style lang="scss">
    $nav-width: 12rem;

    nav {
        box-shadow: $shadow-light;
        height: 100%;
        width: $nav-width;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        // increased to 5 so that on mobile the nav buttons are not cut off
        // by entry group titles
        z-index: 5;
        display: grid;
        grid-template-rows: 1fr 1fr 1fr;
        border-right: 1px solid var(--border-color);
        background: var(--nav-bg);

        @media #{$mobile} {
            display: block;
            height: $mobile-nav-height;
            width: 100%;
            position: static;
            border: none;
        }
    }

    .account-button {
        // show the border line still
        width: calc($nav-width - 1px);
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 0.25rem;
        align-items: center;
        justify-content: flex-start;
        background: var(--v-light-accent);
        padding: 0.75rem;
        text-align: left;

        &:hover {
            background: var(--light-accent);
        }

        @media #{$mobile} {
            padding: 0.5rem;
            border-radius: 0 0 $border-radius 0;
        }
    }

    .account-dropdown {
        background: var(--light-accent);
    }

    .nav-buttons {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        @media #{$mobile} {
            position: fixed;
            bottom: 0;
            left: 0;
            height: fit-content;
            width: 100%;
            z-index: 2000;
            justify-content: space-evenly;
            display: flex;
            flex-direction: row;
            background: var(--nav-bg);
            border: none;
            border-top: 1px solid var(--border-color);
        }

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

            @media #{$mobile} {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                gap: 0.5rem;
            }
        }
    }

    .account-dropdown-options {
        padding: 0.5rem 0;

        button,
        a {
            margin: 0;
            padding: 0.4em 0.8em 0.4em 0.4em;
            width: 100%;
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 1rem;
            align-items: center;
            justify-content: flex-start;
            text-align: left;

            &:hover {
                background-color: var(--v-light-accent);
            }
        }

        hr {
            margin: 10px 0;
            border: none;
            border-bottom: 1px solid var(--background-color);
        }
    }
</style>
