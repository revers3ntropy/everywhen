<script lang="ts">
    import { page } from '$app/stores';
    import AccountCircleOutline from 'svelte-material-icons/AccountCircleOutline.svelte';
    import Brain from 'svelte-material-icons/Brain.svelte';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import Close from 'svelte-material-icons/Close.svelte';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import DownloadLock from 'svelte-material-icons/DownloadLock.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import Home from 'svelte-material-icons/Home.svelte';
    import Lightbulb from 'svelte-material-icons/Lightbulb.svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import Menu from 'svelte-material-icons/Menu.svelte';
    import Moon from 'svelte-material-icons/MoonWaningCrescent.svelte';
    import Notebook from 'svelte-material-icons/Notebook.svelte';
    import Pencil from 'svelte-material-icons/Pencil.svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import Dropdown from '../lib/components/Dropdown.svelte';
    import { LS_KEY } from '../lib/constants';
    import { Backup } from '../lib/controllers/backup';
    import type { Auth } from '../lib/controllers/user';
    import { obfuscated } from '../lib/stores';
    import { api } from '../lib/utils/apiRequest';
    import { displayNotifOnErr } from '../lib/utils/notifications';
    import { wheel } from '../lib/utils/toggleScrollable';

    const { addNotification } = getNotificationsContext();

    export let auth: Auth;

    let showingNavPopup = false;
    let downloadingBackup = false;

    function onClick (_: Event) {
        if (showingNavPopup) {
            showingNavPopup = false;
        }
    }

    function toggleNavPopup (event: Event) {
        event.stopPropagation();
        showingNavPopup = !showingNavPopup;
    }

    async function downloadBackup () {
        if (downloadingBackup) return;
        downloadingBackup = true;
        const { data: backupData } = displayNotifOnErr(addNotification,
            await api.get(auth, '/backups', { encrypted: true }),
        );
        Backup.download(backupData, auth.username);
        downloadingBackup = false;
    }

    async function makeLabelFromNameIfDoesntExist (
        name: string,
        defaultColour: string,
    ): Promise<string> {
        const { labels } = displayNotifOnErr(addNotification,
            await api.get(auth, '/labels'),
        );
        const label = labels.find(label => label.name === name);
        if (label) {
            return label.id;
        }
        const res = displayNotifOnErr(addNotification,
            await api.post(auth, '/labels', {
                name,
                colour: defaultColour,
            }),
        );
        return res.id;
    }

    async function goToEntryFormWithLabel (
        name: string,
        defaultColour: string,
    ) {
        const labelId = await makeLabelFromNameIfDoesntExist(name, defaultColour);
        localStorage.setItem(LS_KEY.newEntryLabel, labelId);
        location.assign('/journal?obfuscate=0');
    }

    async function makeDream () {
        await goToEntryFormWithLabel('Dream', '#7730ce');
    }

    async function makeIdea () {
        await goToEntryFormWithLabel('Idea', '#ffff65');
    }

    async function makeThought () {
        await goToEntryFormWithLabel('Thought', '#735820');
    }

    async function makeEntry () {
        localStorage.removeItem(LS_KEY.newEntryLabel);
        location.assign('/journal');
    }
</script>

<svelte:window
    on:click={onClick}
    use:wheel={{ scrollable: !showingNavPopup }}
/>

<header class="{showingNavPopup ? 'showing-dropdown' : ''}">
    <div class="menu-button-mobile">
        <button
            aria-label="Show nav menu"
            on:click={toggleNavPopup}
        >
            {#if showingNavPopup}
                <Close size="40" />
            {:else}
                <Menu size="40" />
            {/if}
        </button>
    </div>
    <div class="nav-buttons {showingNavPopup ? 'showing' : ''}">
        <a
            aria-label="home"
            class="icon {$page.url.pathname === '/home' ? 'current' : ''}"
            href="/home"
        >
            <Home size="40" />
            <span class="name">Home</span>
        </a>
        <a
            aria-label="journal"
            class="icon {$page.url.pathname === '/journal' ? 'current' : ''}"
            href="/journal"
        >
            <Notebook size="40" />
            <span class="name">Journal</span>
        </a>
        <a
            aria-label="events"
            class="icon {$page.url.pathname === '/events' ? 'current' : ''}"
            href="/events"
        >
            <Calendar size="40" />
            <span class="name">Events</span>
        </a>
        <a
            aria-label="timeline"
            class="icon {$page.url.pathname === '/timeline' ? 'current' : ''}"
            href="/timeline"
        >
            <ChartTimeline size="40" />
            <span class="name">Timeline</span>
        </a>
        <a
            aria-label="statistics"
            class="icon {$page.url.pathname === '/stats' ? 'current' : ''}"
            href="/stats"
        >
            <Counter size="40" />
            <span class="name">Stats</span>
        </a>
    </div>

    <div>
        <Dropdown
            openOnHover
            unstyledButton
            width="170px"
        >
            <span class="create-button" slot="button">
                <Plus size="40" />
            </span>

            <div class="record-something-buttons">
                <div>
                    <button
                        class="primary unbordered oneline record-entry"
                        on:click={makeEntry}
                    >
                        <Pencil size="30" />
                        Record Entry
                    </button>
                </div>
                <div>
                    <button
                        class="primary unbordered oneline record-dream"
                        on:click={makeDream}
                    >
                        <Moon size="30" />
                        Record Dream
                    </button>
                </div>
                <div>
                    <button
                        class="primary unbordered oneline record-idea"
                        on:click={makeIdea}
                    >
                        <Lightbulb size="30" />
                        Record Idea
                    </button>
                </div>
                <div>
                    <button
                        class="primary unbordered oneline record-thought"
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
            on:click={() => $obfuscated = !$obfuscated}
        >
            {#if $obfuscated}
                <Eye size="25" />
            {:else}
                <EyeOff size="25" />
            {/if}
        </button>

        <Dropdown unstyledButton>
            <span class="account-button" slot="button">
                <span class="username-span">
                    {auth.username}
                </span>
                <AccountCircleOutline size="40" />
            </span>

            <button
                aria-label="download encrypted backup"
                class="primary unbordered account-dropdown-button"
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
                class="primary unbordered account-dropdown-button"
                href="/settings"
            >
                <Cog size="30" />
                Settings
            </a>

            <a
                aria-label="log out"
                class="primary unbordered account-dropdown-button"
                href="/logout"
            >
                <Logout size="30" />
                Log Out
            </a>
        </Dropdown>
    </div>
</header>

<style lang="less">
    @import '../styles/variables';
    @import '../styles/layout';

    header {
        position: relative;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0;
        height: var(--nav-height);
        background-color: @header-bg;
        z-index: 10;

        div {
            display: flex;
            align-items: center;
            height: 100%;
        }

        &.showing-dropdown {
            box-shadow: 0 0 4px 4px black;
        }
    }

    a, button {
        margin: 0 4px;

        &.current {
            &:after {
                background-color: @accent-color-secondary;
            }
        }

        .name {
            display: none;
            @media @mobile {
                display: flex;
                align-items: center;
                padding: 0 1rem;
                width: 100%;
            }
        }
    }

    .account-button {
        .bordered();
        display: grid;
        grid-template-columns: 1fr 40px;
        align-items: center;
        gap: .5rem;
        text-align: right;
        cursor: pointer;
        border-radius: @border-radius;
        padding: .1rem .3rem;
        width: fit-content;

        &:hover {
            background-color: @light-accent;
        }
    }

    .username-span {
        min-width: 6rem;
    }

    .menu-button-mobile {
        display: none;
        @media @mobile {
            .flex-center();
        }
    }

    .hide-menu-mobile {
        padding: 0;
        display: none;
        @media @mobile {
            .flex-center();
        }
    }

    .nav-buttons {
        @media @mobile {
            position: absolute;
            height: fit-content;
            top: var(--nav-height);
            left: 0;
            width: 100%;
            z-index: 8;
            justify-content: flex-start;
            display: flex;
            flex-direction: column;
            background: @header-bg;
            transform: translate(0, -50rem);
            transition: transform 200ms ease-in-out;

            &.showing {
                transform: translate(0);
            }

            a, button {
                margin: 0;
                display: grid;
                grid-template-columns: 50px 1fr;
                place-items: center;
                width: 100%;
                text-align: left;
            }
        }
    }

    .account-dropdown-button {
        margin: 0;

        &:hover {
            background-color: @light-v-accent;
            color: @text-color;

            :global(svg), :global(svg *) {
                fill: @accent-color-secondary;
            }
        }
    }

    .create-button {
        &:hover {
            background-color: @bg;
            border-radius: @border-radius;
        }
    }

    .record-something-buttons {

        display: block;
        padding: 0 0 .8rem 0;

        button.primary {
            width: 100%;
            margin: 0;
            border-radius: 0;
            text-align: left;
        }

        .record-entry:hover {
            background: @light-v-accent;
            color: @text-color;

            :global(svg), :global(svg *) {
                fill: @accent-color-primary;
            }
        }

        .record-dream:hover {
            background: rgba(0, 0, 255, 0.1);
            color: @text-color;

            :global(svg), :global(svg *) {
                fill: @accent-color-secondary;
            }
        }

        .record-idea:hover {
            background: rgba(255, 255, 0, 0.1);
            color: @text-color;

            :global(svg), :global(svg *) {
                fill: yellow;
            }
        }

        .record-thought:hover {
            background: rgba(220, 105, 33, 0.1);
            color: @text-color;

            :global(svg), :global(svg *) {
                fill: rgb(183, 110, 30);
            }
        }
    }
</style>
