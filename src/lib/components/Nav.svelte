<script lang="ts">
    import { page } from '$app/stores';
    import CreateNewButton from '$lib/components/CreateNewButton.svelte';
    import { Backup } from '$lib/controllers/backup/backup';
    import { tooltip } from '@svelte-plugins/tooltips';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import ChevronUp from 'svelte-material-icons/ChevronUp.svelte';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import TrashCanOutline from 'svelte-material-icons/TrashCanOutline.svelte';
    import DownloadLock from 'svelte-material-icons/DownloadLock.svelte';
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
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { Auth } from '$lib/controllers/auth/auth';
    import { slide } from 'svelte/transition';

    async function downloadBackup() {
        if (isDownloadingBackup) return;
        isDownloadingBackup = true;
        const { data: backupData } = notify.onErr(await api.get('/backups', { encrypted: 1 }));
        Backup.download(backupData, $username, true);
        isDownloadingBackup = false;
    }

    function lock() {
        passcodeLastEntered.set(0);
    }

    function switchTheme() {
        theme.set($theme === Theme.light ? Theme.dark : Theme.light);
    }

    let isDownloadingBackup = false;
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

                    <button
                        aria-label="download encrypted backup"
                        class="account-dropdown-button"
                        disabled={isDownloadingBackup}
                        on:click={downloadBackup}
                    >
                        <DownloadLock size="30" />
                        {#if isDownloadingBackup}
                            Downloading...
                        {:else}
                            Download Backup
                        {/if}
                    </button>

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
                        <Cog size="30" />
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

            <div class="w-fit h-fit p-1 border-r bordered m-1 md:m-2">
                <CreateNewButton />
            </div>

            <div class="p-3 py-2">
                <button
                    class="with-icon"
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
                class="nav-link p-1"
                class:current={$page.url.pathname.startsWith('/journal') &&
                    !$page.url.pathname.startsWith('/journal/deleted')}
            >
                <Notebook size="30" />
                <span class="flex">
                    <span class="pr-2"> Journal </span>
                    {#if $page.url.pathname.startsWith('/journal')}
                        <ChevronUp />
                    {:else}
                        <ChevronDown />
                    {/if}
                </span>
            </a>
            {#if $page.url.pathname.startsWith('/journal')}
                <a
                    href="/journal/deleted"
                    class="nav-link p-1 pl-4"
                    class:current={$page.url.pathname.startsWith('/journal/deleted')}
                    aria-label="events"
                    transition:slide={{ duration: ANIMATION_DURATION }}
                >
                    <TrashCanOutline size="25" />
                    <span> Bin </span>
                </a>
            {/if}

            <a
                href="/timeline"
                aria-label="timeline"
                class="nav-link p-1"
                class:current={$page.url.pathname.startsWith('/timeline')}
            >
                <ChartTimeline size="30" />
                <span> Timeline </span>
            </a>
            <a
                href="/map"
                aria-label="map"
                class="nav-link p-1"
                class:current={$page.url.pathname.startsWith('/map')}
            >
                <MapMarkerOutline size="30" />
                <span> Map </span>
            </a>
            <a
                href="/stats"
                class="nav-link p-1"
                class:current={$page.url.pathname.startsWith('/stats')}
                aria-label="statistics"
            >
                <Counter size="30" />
                <span> Insights </span>
            </a>
            <a
                href="/datasets"
                class="nav-link p-1"
                class:current={$page.url.pathname.startsWith('/datasets')}
                aria-label="datasets"
            >
                <ChartMultiple size="30" />
                <span> Datasets </span>
            </a>
            <a
                href="/events"
                class="nav-link p-1"
                class:current={$page.url.pathname.startsWith('/events')}
                aria-label="events"
            >
                <CalendarMultiple size="30" />
                <span> Events </span>
            </a>
            <a
                href="/assets"
                class="nav-link p-1"
                class:current={$page.url.pathname.startsWith('/assets')}
                aria-label="assets"
            >
                <ImageMultipleOutline size="30" />
                <span> Gallery </span>
            </a>
            <a
                href="/labels"
                class="nav-link p-1"
                class:current={$page.url.pathname.startsWith('/labels')}
                aria-label="labels"
            >
                <LabelMultipleOutline size="30" />
                <span> Labels </span>
            </a>
            <a
                href="/settings"
                class="nav-link p-1"
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
    @import '$lib/styles/layout';
    @import '$lib/styles/input';
    @import '$lib/styles/text';

    $nav-width: 12rem;

    nav {
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

        .nav-link {
            width: 100%;
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 1rem;
            align-items: center;
            justify-content: flex-start;
            text-decoration: none;

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
