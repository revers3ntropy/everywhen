<script lang="ts">
    import { page } from '$app/stores';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import Home from 'svelte-material-icons/Home.svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import Notebook from 'svelte-material-icons/Notebook.svelte';
</script>
<header>
    <div></div>

    <div>
        <a
            aria-label="home"
            class="{$page.url.pathname === '/home' ? 'current' : ''}"
            href="/home"
        >
            <Home size="40" />
        </a>
        <a
            aria-label="diary"
            class="{$page.url.pathname === '/diary' ? 'current' : ''}"
            href="/diary"
        >
            <Notebook size="40" />
        </a>
        <a
            aria-label="events"
            class="{$page.url.pathname === '/events' ? 'current' : ''}"
            href="/events"
        >
            <Calendar size="40" />
        </a>
        <a
            aria-label="timeline"
            class="{$page.url.pathname === '/timeline' ? 'current' : ''}"
            href="/timeline"
        >
            <ChartTimeline size="40" />
        </a>
        <a
            aria-label="statistics"
            class="{$page.url.pathname === '/stats' ? 'current' : ''}"
            href="/stats"
        >
            <Counter size="40" />
        </a>
    </div>

    <div>
        <a aria-label="log out" href="/logout">
            <Logout size="40" />
        </a>
    </div>
</header>

<style lang="less">
    @import '../../styles/variables';

    header {
        position: relative;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0;
        height: 60px;
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
</style>
