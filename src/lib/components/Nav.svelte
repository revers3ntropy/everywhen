<script lang="ts">
    import { page } from '$app/stores';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import Home from 'svelte-material-icons/Home.svelte';
    import LabelOutline from 'svelte-material-icons/LabelOutline.svelte';
    import Login from 'svelte-material-icons/Login.svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import Notebook from 'svelte-material-icons/Notebook.svelte';

    export let user = null;
</script>
<header>
    <div></div>

    <div>
        {#if user}
            <a href="/home"
               class="{$page.url.pathname === '/home' ? 'current' : ''}"
            >
                <Home size="40" />
            </a>
            <a href="/diary"
               class="{$page.url.pathname === '/diary' ? 'current' : ''}"
            >
                <Notebook size="40" />
            </a>
            <a href="/labels"
               class="{$page.url.pathname === '/labels' ? 'current' : ''}"
            >
                <LabelOutline size="40" />
            </a>
            <a href="/timeline"
               class="{$page.url.pathname === '/timeline' ? 'current' : ''}"
            >
                <ChartTimeline size="40" />
            </a>
            <a href="/stats"
               class="{$page.url.pathname === '/stats' ? 'current' : ''}"
            >
                <ChartTimeline size="40" />
            </a>
        {/if}
    </div>

    <div>
        {#if user}
            <a href="/logout">
                <Logout size="40" />
            </a>
        {:else}
            <a href="/">
                <Login size="40" />
            </a>
        {/if}
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
