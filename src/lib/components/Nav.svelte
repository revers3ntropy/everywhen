<script lang="ts">
    import { page } from '$app/stores';
    import CreateNewButton from '$lib/components/CreateNewButton.svelte';
    import { Backup } from '$lib/controllers/backup/backup';
    import { tooltip } from '@svelte-plugins/tooltips';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import DownloadLock from 'svelte-material-icons/DownloadLock.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import Lock from 'svelte-material-icons/Lock.svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import MapMarkerOutline from 'svelte-material-icons/MapMarkerOutline.svelte';
    import Notebook from 'svelte-material-icons/Notebook.svelte';
    import LightTheme from 'svelte-material-icons/WhiteBalanceSunny.svelte';
    import DarkTheme from 'svelte-material-icons/WeatherNight.svelte';
    import Dropdown from '$lib/components/Dropdown.svelte';
    import Streaks from '$lib/components/Streaks.svelte';
    import { Theme } from '$lib/constants';
    import { obfuscated, passcodeLastEntered, settingsStore, theme, username } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { Auth } from '$lib/controllers/auth/auth';

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
        <Dropdown width="200px">
            <div class="account-button" slot="button">
                <span> <Streaks condensed /> </span>
                <span> {$username || '...'} </span>
            </div>

            <div class="account-dropdown-options">
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

        <div class="p-2">
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

        <div class="p-2">
            <CreateNewButton />
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

    <div class="nav-buttons">
        <a
            href="/journal"
            aria-label="journal"
            class="nav-link"
            class:current={$page.url.pathname.startsWith('/journal')}
        >
            <Notebook size="35" />
            <span class="hide-mobile"> Journal </span>
        </a>
        <a
            href="/timeline"
            aria-label="timeline"
            class="nav-link"
            class:current={$page.url.pathname.startsWith('/timeline')}
        >
            <ChartTimeline size="35" />
            <span class="hide-mobile"> Timeline </span>
        </a>
        <a
            href="/map"
            aria-label="map"
            class="nav-link"
            class:current={$page.url.pathname.startsWith('/map')}
        >
            <MapMarkerOutline size="35" />
            <span class="hide-mobile"> Map </span>
        </a>
        <a
            href="/stats"
            aria-label="statistics"
            class="nav-link"
            class:current={$page.url.pathname.startsWith('/stats')}
        >
            <Counter size="35" />
            <span class="hide-mobile"> Insights </span>
        </a>
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
        display: flex;
        flex-direction: column;

        @media #{$mobile} {
            display: block;
            height: $mobile-nav-height;
            width: 100%;
            position: static;
        }
    }

    .account-button {
        width: $nav-width;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 1rem;
        align-items: center;
        justify-content: flex-start;
        background: var(--light-accent);
        padding: 0.5rem;
        text-align: left;
        border-radius: 0 0 $border-radius 0;
    }

    .account-dropdown {
        background: var(--light-accent);
    }

    .nav-buttons {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        gap: 4px;

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
            padding: 0.8rem 0;
            border-top: 1px solid var(--border-color);
        }

        .nav-link {
            width: 100%;
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 1rem;
            align-items: center;
            justify-content: flex-start;
            border-radius: 0 $border-radius $border-radius 0;
            padding: 0.25rem;
            text-decoration: none;

            :global(*) {
                transition: $transition;
            }

            &:hover {
                background: var(--v-light-accent);
            }

            &.current {
                background: var(--primary-light);
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
