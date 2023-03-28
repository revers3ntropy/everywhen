<script lang="ts">
    import { page } from '$app/stores';
    import AccountCircleOutline from 'svelte-material-icons/AccountCircleOutline.svelte';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import Close from 'svelte-material-icons/Close.svelte';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import Home from 'svelte-material-icons/Home.svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import Menu from 'svelte-material-icons/Menu.svelte';
    import Notebook from 'svelte-material-icons/Notebook.svelte';
    import Dropdown from '../lib/components/Dropdown.svelte';
    import type { Auth } from '../lib/controllers/user';
    import { wheel } from '../lib/utils/toggleScrollable';

    export let auth: Auth;

    let showingNavPopup = false;

    function onClick (_: Event) {
        if (showingNavPopup) {
            showingNavPopup = false;
        }
    }

    function openNavPopup (event: Event) {
        event.stopPropagation();
        showingNavPopup = true;
    }
</script>

<svelte:window
    on:click={onClick}
    use:wheel={{ scrollable: !showingNavPopup }}
/>

<header>
    <div class="menu-button-mobile">
        <button
            aria-label="Show nav menu"
            on:click={openNavPopup}
        >
            <Menu size="40" />
        </button>
    </div>
    <div class="nav-buttons {showingNavPopup ? 'showing' : ''}">
        <button
            aria-label="Hide nav menu"
            class="hide-menu-mobile"
            on:click={() => (showingNavPopup = false)}
        >
            <Close size="40" />
        </button>
        <a
            aria-label="home"
            class="icon {$page.url.pathname === '/home' ? 'current' : ''}"
            href="/home"
        >
            <Home size="40" />
            <span class="name">Home</span>
        </a>
        <a
            aria-label="diary"
            class="icon {$page.url.pathname === '/diary' ? 'current' : ''}"
            href="/diary"
        >
            <Notebook size="40" />
            <span class="name">Diary</span>
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
        <Dropdown unstyledButton={true}>
            <span class="account-button" slot="button">
                <span class="username-span">
                    {auth.username}
                </span>
                <AccountCircleOutline size="40" />
            </span>

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
        border-radius: 10px;
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
            height: 0;
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 20;
            justify-content: flex-start;


            &.showing {
                height: fit-content;
                display: flex;
                flex-direction: column;

                background: @header-bg;
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
</style>
