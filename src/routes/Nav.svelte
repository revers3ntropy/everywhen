<script lang="ts">
    import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
    import { page } from '$app/stores';
    import AccountCircleOutline from 'svelte-material-icons/AccountCircleOutline.svelte';
    import Brain from 'svelte-material-icons/Brain.svelte';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import DownloadLock from 'svelte-material-icons/DownloadLock.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import Home from 'svelte-material-icons/Home.svelte';
    import Lightbulb from 'svelte-material-icons/Lightbulb.svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import MapMarkerOutline from 'svelte-material-icons/MapMarkerOutline.svelte';
    import Moon from 'svelte-material-icons/MoonWaningCrescent.svelte';
    import Notebook from 'svelte-material-icons/Notebook.svelte';
    import Pencil from 'svelte-material-icons/Pencil.svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import Dropdown from '$lib/components/Dropdown.svelte';
    import Streaks from '$lib/components/Streaks.svelte';
    import { LS_KEY } from '$lib/constants';
    import { Backup } from '$lib/controllers/backup';
    import type { Auth } from '$lib/controllers/user';
    import { obfuscated } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/notifications/notifications';

    export let auth: Auth;

    let downloadingBackup = false;

    async function downloadBackup() {
        if (downloadingBackup) return;
        downloadingBackup = true;
        const { data: backupData } = displayNotifOnErr(
            await api.get(auth, '/backups', { encrypted: 1 })
        );
        Backup.download(backupData, auth.username, true);
        downloadingBackup = false;
    }

    async function makeLabelFromNameIfDoesntExist(
        name: string,
        defaultColour: string
    ): Promise<string> {
        const { labels } = displayNotifOnErr(await api.get(auth, '/labels'));
        const label = labels.find(label => label.name === name);
        if (label) {
            return label.id;
        }
        const res = displayNotifOnErr(
            await api.post(auth, '/labels', {
                name,
                colour: defaultColour
            })
        );
        return res.id;
    }

    async function goToEntryFormWithLabel(name: string, defaultColour: string) {
        const labelId = await makeLabelFromNameIfDoesntExist(
            name,
            defaultColour
        );
        localStorage.setItem(LS_KEY.newEntryLabel, labelId);
        if ($page.url.pathname === '/journal') {
            location.reload();
        } else {
            await goto('/journal');
        }
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
        localStorage.removeItem(LS_KEY.newEntryLabel);
        if ($page.url.pathname === '/journal') {
            location.reload();
        } else {
            await goto('/journal');
        }
    }

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
            <Home size="35" />
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
        <Dropdown openOnHover width="170px">
            <span class="create-button" slot="button">
                <Plus size="25" />
            </span>

            <div class="record-something-buttons">
                <div>
                    <button
                        class="with-icon oneline record-entry"
                        on:click={makeEntry}
                    >
                        <Pencil size="30" />
                        Record Entry
                    </button>
                </div>
                <div>
                    <button
                        class="with-icon oneline record-dream"
                        on:click={makeDream}
                    >
                        <Moon size="30" />
                        Record Dream
                    </button>
                </div>
                <div>
                    <button
                        class="with-icon oneline record-idea"
                        on:click={makeIdea}
                    >
                        <Lightbulb size="30" />
                        Record Idea
                    </button>
                </div>
                <div>
                    <button
                        class="with-icon oneline record-thought"
                        on:click={makeThought}
                    >
                        <Brain size="30" />
                        Record Thought
                    </button>
                </div>
            </div>
        </Dropdown>

        <button
            aria-label={$obfuscated ? 'Show all' : 'Hide all'}
            on:click={() => ($obfuscated = !$obfuscated)}
        >
            {#if $obfuscated}
                <Eye size="25" />
            {:else}
                <EyeOff size="25" />
            {/if}
        </button>

        <Dropdown fromRight width="200px">
            <span class="account-button" slot="button">
                <span class="username-span">
                    <span class="streaks">
                        <Streaks {auth} />
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
                <button
                    aria-label="download encrypted backup"
                    class="account-dropdown-button"
                    disabled={downloadingBackup}
                    on:click={downloadBackup}
                >
                    <DownloadLock size="30" />
                    {#if downloadingBackup}
                        Downloading...
                    {:else}
                        Download Backup
                    {/if}
                </button>

                <a
                    aria-label="settings"
                    class="account-dropdown-button"
                    href="/settings"
                >
                    <Cog size="30" />
                    Settings
                </a>

                <a
                    aria-label="log out"
                    class="account-dropdown-button"
                    href="/logout"
                    data-sveltekit-preload-data="tap"
                >
                    <Logout size="30" />
                    Log Out
                </a>
            </div>
        </Dropdown>
    </div>
</nav>

<style lang="less">
    @import '../styles/variables';
    @import '../styles/layout';
    @import '../styles/input';

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

        &.showing-dropdown {
            box-shadow: 0 0 4px 4px black;
            background: @header-bg;
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
            background: @accent-secondary;
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
                background: @accent-secondary;
            }
        }
    }

    .account-dropdown {
        background: @light-accent;
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
        background: @header-bg;

        &:hover {
            background-color: @light-accent;
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
                text-align: right;
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
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
            background: @header-bg;
            padding: 0.8rem 0;
            border-top: 1px solid @border;
        }
    }

    .account-dropdown-options {
        padding: 0.5rem 0;

        .account-dropdown-button {
            margin: 0;
            padding: 0.4em 0.8em 0.4em 0.4em;
            width: 100%;
            color: @text-color;
            display: grid;
            grid-template-columns: 35px 1fr;
            align-items: center;
            justify-content: start;
            text-align: left;

            &:hover {
                background-color: @light-v-accent;

                :global(svg),
                :global(svg *) {
                    fill: @accent-secondary;
                }
            }
        }
    }

    .right-options {
        gap: 0.5rem;

        .create-button {
            .flex-center();

            border-radius: 50%;
            background: @light-accent;
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
            color: @text-color;
            transition: @transition;
        }

        .record-entry:hover {
            background: @light-v-accent;

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
    }
</style>
