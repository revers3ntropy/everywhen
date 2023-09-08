<script lang="ts">
    import { page } from '$app/stores';
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
    <div class="top-options">
        <span class="streaks">
            <Streaks condensed />
        </span>
        <Dropdown width="200px">
            <span class="account-button" slot="button">
                {$username || '...'}
            </span>

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

        <button
            aria-label={$obfuscated ? 'Show all' : 'Hide all'}
            on:click={() => obfuscated.set(!$obfuscated)}
        >
            {#if $obfuscated}
                <Eye size="25" />
            {:else}
                <EyeOff size="25" />
            {/if}
        </button>

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
            class="with-circled-icon"
            class:current={$page.url.pathname.startsWith('/journal')}
        >
            <Notebook size="35" />
            <span class="hide-mobile"> Journal </span>
        </a>
        <a
            href="/timeline"
            aria-label="timeline"
            class="with-circled-icon"
            class:current={$page.url.pathname.startsWith('/timeline')}
        >
            <ChartTimeline size="35" />
            <span class="hide-mobile"> Timeline </span>
        </a>
        <a
            href="/map"
            aria-label="map"
            class="with-circled-icon"
            class:current={$page.url.pathname.startsWith('/map')}
        >
            <MapMarkerOutline size="35" />
            <span class="hide-mobile"> Map </span>
        </a>
        <a
            href="/stats"
            aria-label="statistics"
            class="with-circled-icon"
            class:current={$page.url.pathname.startsWith('/stats')}
        >
            <Counter size="35" />
            <span class="hide-mobile"> Insights </span>
        </a>
    </div>

    <div />
</nav>

<style lang="scss">
    @import '../../styles/variables';
    @import '../../styles/layout';
    @import '../../styles/input';
    @import '../../styles/text';

    nav {
        height: 100%;
        width: 10rem;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        // increased to 5 so that on mobile the nav buttons are not cut off
        // by entry group titles
        z-index: 5;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: var(--nav-bg);

        @media #{$mobile} {
            display: block;
            height: var(--nav-height);
            width: 100%;
            position: static;
        }
    }

    .account-dropdown {
        background: var(--light-accent);
    }

    .top-options {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.5rem 0;
    }

    .nav-buttons {
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
    }

    .account-dropdown-options {
        padding: 0.5rem 0;

        button,
        a {
            margin: 0;
            padding: 0.4em 0.8em 0.4em 0.4em;
            width: 100%;
            display: grid;
            grid-template-columns: 35px 1fr;
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

    .right-options {
        gap: 0.5rem;

        .create-button {
            display: grid;
            place-items: center;
            padding: 0;
            margin: 0 5px 0 2px;
            border-radius: 50%;
            background: var(--light-accent);
            width: 30px;
            height: 30px;

            &:hover {
                background: none;
            }
        }
    }

    .record-something-buttons {
        display: block;
        padding: 0.8rem 0 0.8rem 0;

        button {
            width: 100%;
            padding: 0.4em 0.8em 0.4em 0.4em;
            margin: 0;
            border-radius: 0;
            text-align: left;
            color: var(--text-color);
            transition: #{$transition};
        }

        .record-entry:hover {
            background: var(--v-light-accent);

            :global(svg),
            :global(svg *) {
                fill: url(#accent-gradient);
            }
        }

        .record-bullet:hover {
            background: var(--v-light-accent);

            :global(svg),
            :global(svg *) {
                fill: url(#accent-gradient);
            }
        }

        .record-dream:hover {
            background: rgba(0, 0, 255, 0.1);

            :global(svg),
            :global(svg *) {
                fill: url(#dream-gradient);
            }
        }

        .record-idea:hover {
            background: rgba(255, 255, 0, 0.1);

            :global(svg),
            :global(svg *) {
                fill: url(#idea-gradient);
            }
        }

        .record-thought:hover {
            background: rgba(170, 212, 205, 0.1);

            :global(svg),
            :global(svg *) {
                fill: url(#thought-gradient);
            }
        }

        .new-event:hover {
            background: var(--v-light-accent);
        }
    }
</style>
