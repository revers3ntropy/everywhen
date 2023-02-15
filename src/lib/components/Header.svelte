<script lang="ts">
    import Notebook from "svelte-material-icons/Notebook.svelte";
    import Logout from "svelte-material-icons/Logout.svelte";
    import Login from "svelte-material-icons/Login.svelte";
    import Home from "svelte-material-icons/Home.svelte";
    import LabelOutline from "svelte-material-icons/LabelOutline.svelte";
    import { page } from "$app/stores";

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
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 20px;
        height: 60px;
        background-color: @header-bg;

        div {
            display: flex;
            align-items: center;
            height: 100%;
        }
    }

    a, button {
        &.current {
            &:after {
                background-color: @accent-color-secondary;
            }
        }
    }
</style>
