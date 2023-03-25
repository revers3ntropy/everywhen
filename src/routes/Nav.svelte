<script lang="ts">
    import { page } from '$app/stores';
    import AccountCircleOutline from 'svelte-material-icons/AccountCircleOutline.svelte';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import Home from 'svelte-material-icons/Home.svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import Notebook from 'svelte-material-icons/Notebook.svelte';
    import Dropdown from '../lib/components/Dropdown.svelte';
    import type { Auth } from '../lib/controllers/user';

    export let auth: Auth;
</script>
<header>
    <div>
        <a
            aria-label="home"
            class="icon {$page.url.pathname === '/home' ? 'current' : ''}"
            href="/home"
        >
            <Home size="40" />
        </a>
        <a
            aria-label="diary"
            class="icon {$page.url.pathname === '/diary' ? 'current' : ''}"
            href="/diary"
        >
            <Notebook size="40" />
        </a>
        <a
            aria-label="events"
            class="icon {$page.url.pathname === '/events' ? 'current' : ''}"
            href="/events"
        >
            <Calendar size="40" />
        </a>
        <a
            aria-label="timeline"
            class="icon {$page.url.pathname === '/timeline' ? 'current' : ''}"
            href="/timeline"
        >
            <ChartTimeline size="40" />
        </a>
        <a
            aria-label="statistics"
            class="icon {$page.url.pathname === '/stats' ? 'current' : ''}"
            href="/stats"
        >
            <Counter size="40" />
        </a>
    </div>

    <div>
        <Dropdown unstyledButton={true}>
            <span class="account-button" slot="button">
                {auth.username}
                <AccountCircleOutline size="40" />
            </span>

            <a
                aria-label="log out"
                class="primary unbordered"
                href="/logout"
            >
                <Logout size="40" />
                Log Out
            </a>
        </Dropdown>
    </div>
</header>

<style lang="less">
    @import '../styles/variables';

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
    }

    .account-button {
        display: grid;
        grid-template-columns: 1fr 40px;
        align-items: center;
        gap: .5rem;
        text-align: right;
        cursor: pointer;
        border-radius: 10px;
        padding: .1rem .3rem;

        &:hover {
            background-color: @light-accent;
        }
    }
</style>
