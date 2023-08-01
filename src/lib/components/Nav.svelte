<script lang="ts">
    import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { logOut } from '$lib/security/logOut';
    import { tooltip } from '@svelte-plugins/tooltips';
    import AccountCircleOutline from 'svelte-material-icons/AccountCircleOutline.svelte';
    import Brain from 'svelte-material-icons/Brain.svelte';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import DownloadLock from 'svelte-material-icons/DownloadLock.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import Lock from 'svelte-material-icons/Lock.svelte';
    import HomeOutline from 'svelte-material-icons/HomeOutline.svelte';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import Lightbulb from 'svelte-material-icons/Lightbulb.svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import MapMarkerOutline from 'svelte-material-icons/MapMarkerOutline.svelte';
    import Moon from 'svelte-material-icons/MoonWaningCrescent.svelte';
    import Notebook from 'svelte-material-icons/Notebook.svelte';
    import Pencil from 'svelte-material-icons/Pencil.svelte';
    import BulletPoints from 'svelte-material-icons/FormatListBulleted.svelte';
    import LightTheme from 'svelte-material-icons/WhiteBalanceSunny.svelte';
    import DarkTheme from 'svelte-material-icons/WeatherNight.svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import Dropdown from '$lib/components/Dropdown.svelte';
    import Streaks from '$lib/components/Streaks.svelte';
    import { STORE_KEY, Theme } from '$lib/constants';
    import { Backup } from '$lib/controllers/backup/backup.client';
    import type { Auth } from '$lib/controllers/user/user';
    import { Event as EventController } from '$lib/controllers/event/event.client';
    import { nowUtc } from '$lib/utils/time';
    import {
        eventsSortKey,
        obfuscated,
        passcodeLastEntered,
        settingsStore,
        theme
    } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';

    export let auth: Auth;

    async function downloadBackup() {
        if (isDownloadingBackup) return;
        isDownloadingBackup = true;
        const { data: backupData } = displayNotifOnErr(
            await api.get(auth, '/backups', { encrypted: 1 })
        );
        Backup.download(backupData, auth.username, true);
        isDownloadingBackup = false;
    }

    async function makeLabelFromNameIfDoesntExist(
        name: string,
        defaultColor: string
    ): Promise<string> {
        const { labels } = displayNotifOnErr(await api.get(auth, '/labels'));
        const label = labels.find(label => label.name === name);
        if (label) {
            return label.id;
        }
        const res = displayNotifOnErr(
            await api.post(auth, '/labels', {
                name,
                color: defaultColor
            })
        );
        return res.id;
    }

    async function gotoIfNotAt(path: string) {
        if ($page.url.pathname === path) {
            location.reload();
        } else {
            await goto(path);
        }
    }

    async function goToEntryFormWithLabel(name: string, defaultColor: string) {
        await api.put(auth, '/settings', {
            key: 'entryFormMode',
            value: false
        });
        const labelId = await makeLabelFromNameIfDoesntExist(name, defaultColor);
        localStorage.setItem(STORE_KEY.newEntryLabel, labelId);
        await gotoIfNotAt('/journal');
    }

    async function makeDream() {
        await goToEntryFormWithLabel('Dream', '#7730ce');
    }

    async function makeIdea() {
        await goToEntryFormWithLabel('Idea', '#ffff65');
    }

    async function makeThought() {
        await goToEntryFormWithLabel('Thought', '#735820');
    }

    async function makeEntry() {
        await api.put(auth, '/settings', {
            key: 'entryFormMode',
            value: false
        });
        $settingsStore.entryFormMode.value = false;
        localStorage.removeItem(STORE_KEY.newEntryLabel);
        await gotoIfNotAt('/journal');
    }

    async function makeBullet() {
        await api.put(auth, '/settings', {
            key: 'entryFormMode',
            value: true
        });
        $settingsStore.entryFormMode.value = true;
        if ($page.url.pathname !== '/journal') {
            await goto('/journal');
        } else {
            location.reload();
        }
    }

    async function makeEvent() {
        // put the new event at the top of the list
        eventsSortKey.set('created');

        const now = nowUtc();
        displayNotifOnErr(
            await api.post(auth, '/events', {
                name: EventController.NEW_EVENT_NAME,
                start: now,
                end: now
            })
        );

        await gotoIfNotAt('/events');
    }

    function lock() {
        passcodeLastEntered.set(0);
    }

    function switchTheme() {
        theme.set($theme === Theme.light ? Theme.dark : Theme.light);
    }

    let isDownloadingBackup = false;

    let navigating = false;
    let finishedNavigation = false;
    beforeNavigate(() => {
        navigating = true;
        finishedNavigation = false;
    });
    afterNavigate(() => {
        navigating = false;
        finishedNavigation = true;

        setTimeout(() => {
            finishedNavigation = false;
        }, 100);
    });
</script>

<svg class="accent-gradient-svg" height={0} width={0}>
    <linearGradient id="dream-gradient" x1={1} x2={1} y1={0} y2={1}>
        <stop offset={0} stop-color="rgb(252,233,255)" />
        <stop offset={1} stop-color="rgb(196,197,255)" />
    </linearGradient>
</svg>
<svg class="accent-gradient-svg" height={0} width={0}>
    <linearGradient id="idea-gradient" x1={1} x2={1} y1={0} y2={1}>
        <stop offset={0} stop-color="white" />
        <stop offset={1} stop-color="yellow" />
    </linearGradient>
</svg>
<svg class="accent-gradient-svg" height={0} width={0}>
    <linearGradient id="thought-gradient" x1={1} x2={1} y1={0} y2={1}>
        <stop offset={0} stop-color="rgb(155,208,198)" />
        <stop offset={1} stop-color="rgb(213,231,227)" />
    </linearGradient>
</svg>

<span class="nav-loader-wrapper">
    <span
        class="nav-loader {navigating ? 'navigating' : ''} {finishedNavigation
            ? 'finished-navigation'
            : ''}"
    />
</span>

<nav>
    <div class="nav-buttons">
        <a
            aria-label="home"
            class="icon {$page.url.pathname === '/home' ? 'current' : ''}"
            href="/home"
        >
            <HomeOutline size="35" />
        </a>
        <a
            aria-label="journal"
            class="icon {$page.url.pathname === '/journal' ? 'current' : ''}"
            href="/journal"
        >
            <Notebook size="35" />
        </a>
        <a
            aria-label="timeline"
            class="icon {$page.url.pathname === '/timeline' ? 'current' : ''}"
            href="/timeline"
        >
            <ChartTimeline size="35" />
        </a>
        <a
            aria-label="map"
            class="icon {$page.url.pathname === '/map' ? 'current' : ''}"
            href="/map"
        >
            <MapMarkerOutline size="35" />
        </a>
        <a
            aria-label="statistics"
            class="icon {$page.url.pathname === '/stats' ? 'current' : ''}"
            href="/stats"
        >
            <Counter size="35" />
        </a>
    </div>

    <div class="right-options">
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

        <Dropdown openOnHover fromRight width="170px">
            <span class="create-button" slot="button">
                <Plus size="25" />
            </span>

            <div class="record-something-buttons">
                <button class="with-icon oneline record-entry" on:click={makeEntry}>
                    <Pencil size="30" />
                    Record Entry
                </button>
                <button class="with-icon oneline record-bullet" on:click={makeBullet}>
                    <BulletPoints size="30" />
                    Record Bullet
                </button>

                <button class="with-icon oneline record-dream" on:click={makeDream}>
                    <Moon size="30" />
                    Record Dream
                </button>

                <button class="with-icon oneline record-idea" on:click={makeIdea}>
                    <Lightbulb size="30" />
                    Record Idea
                </button>

                <button class="with-icon oneline record-thought" on:click={makeThought}>
                    <Brain size="30" />
                    Record Thought
                </button>

                <button class="with-icon oneline new-event" on:click={makeEvent}>
                    <Calendar size="30" />
                    New Event
                </button>
            </div>
        </Dropdown>

        <Dropdown fromRight width="200px">
            <span class="account-button" slot="button">
                <span class="username-span">
                    <span class="streaks">
                        <Streaks {auth} condensed />
                    </span>
                    <span class="username">
                        {auth.username}
                    </span>
                </span>
                <span class="hide-mobile flex-center">
                    <AccountCircleOutline size="35" />
                </span>
            </span>

            <div class="account-dropdown-options">
                <Streaks {auth} tooltipPosition="left" />

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
                    {#if $theme === Theme.dark}
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
                    on:click={() => logOut()}
                >
                    <Logout size="30" />
                    Log Out
                </button>
            </div>
        </Dropdown>
    </div>
</nav>

<style lang="less">
    @import '../../styles/variables';
    @import '../../styles/layout';
    @import '../../styles/input';
    @import '../../styles/text';

    nav {
        position: relative;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: var(--nav-height);
        // increased to 5 so that on mobile the nav buttons are not cut off
        // by entry group titles
        z-index: 5;

        padding: 0 5px;

        @media @mobile {
            justify-content: end;
        }

        & > div {
            display: flex;
            align-items: center;
            height: 100%;
        }
    }

    .nav-loader-wrapper {
        width: 100%;

        .nav-loader {
            width: 0;
            height: 3px;
            position: fixed;
            top: 0;
            background: var(--primary);
            transition: width 12s cubic-bezier(0, 1, 0.5, 0.5);
            z-index: 10000;

            &.navigating {
                width: 100%;
            }

            &.finished-navigation {
                display: none;
            }
        }
    }

    a,
    button {
        margin: 0 4px;

        &.current {
            &:after {
                background: var(--primary);
            }
        }
    }

    .account-dropdown {
        background: var(--light-accent);
    }

    .account-button {
        .bordered();
        display: grid;
        grid-template-columns: 1fr 40px;
        align-items: center;
        gap: 0.5rem;
        text-align: right;
        cursor: pointer;
        border-radius: @border-radius;
        padding: 0.1rem 0.3rem;
        width: fit-content;
        background: var(--nav-bg);

        &:hover {
            background-color: var(--light-accent);
        }

        @media @mobile {
            height: 40px;
            grid-template-columns: 1fr;
        }

        .username-span {
            min-width: 6rem;
            display: grid;
            grid-template-columns: 3.2rem 1fr;
            place-items: center;

            @media @mobile {
                padding-right: 0.4rem;
            }

            .streaks {
                display: flex;
                justify-content: flex-start;
                align-items: center;
                width: 100%;
                height: 100%;
            }

            .username {
                .ellipsis();
                text-align: right;
                width: 100%;
            }
        }
    }

    .nav-buttons {
        @media @mobile {
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
            justify-content: start;
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
            transition: @transition;
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
