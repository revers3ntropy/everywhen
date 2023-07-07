<script lang="ts">
    import '../app.less';
    import type { PageData } from './$types';
    import { onMount } from 'svelte';
    import { navigating } from '$app/stores';
    import Modal from 'svelte-simple-modal';
    import Notifications from '$lib/components/notifications/Notifications.svelte';
    import { POLL_FOR_UPDATE_INTERVAL } from '$lib/constants';
    import { populateCookieWritablesWithCookies, popup, theme } from '$lib/stores';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';
    import NewVersionAvailable from '$lib/components/NewVersionAvailable.svelte';
    import Footer from '$lib/components/Footer.svelte';

    export let data: PageData;

    // Fill the stores with the data from the server, while server side
    // and client side.
    // This means that the stores will be populated the whole time,
    // e.g. the theme will be loaded server side so no flash of light
    populateCookieWritablesWithCookies(data.__cookieWritables, data.settings);

    async function checkForUpdate() {
        // if another update comes out, the new version will be wrong
        // but the version the user switches too will be correct
        // so don't bother checking for updates if there is already one
        if (newVersionAvailable) return;

        // only check for updates if the user is actually on this tab
        if (document.visibilityState !== 'visible') return;

        const currentVersion = __VERSION__;
        newVersion = displayNotifOnErr(await api.get(null, '/version')).v;
        newVersionAvailable = newVersion !== currentVersion;
    }

    onMount(() => {
        setInterval(() => {
            void checkForUpdate();
        }, POLL_FOR_UPDATE_INTERVAL);

        document.onvisibilitychange = () => void checkForUpdate();
    });

    let newVersionAvailable = false;
    let newVersion = '<error>';
    let root: HTMLDivElement;

    $: if ($navigating) {
        // when the page changes, close the popup
        // and scroll to the top
        popup.set(null);
        if (root) {
            root.scrollTop = 0;
        }
    }
</script>

<svelte:head>
    <title>Halcyon.Land</title>
    <meta content="Journal and Life Logging app" name="description" />
</svelte:head>

<noscript>
    <style>
        .root {
            display: none;
        }
    </style>
    <div class="root">
        <h1>Enable JavaScript</h1>
        <p>
            Halcyon.Land requires JavaScript to be enabled to function. Please enable JavaScript and
            refresh the page.
        </p>
    </div>
</noscript>

<div data-sveltekit-preload-data="hover" data-theme={$theme} class="root" bind:this={root}>
    <svg class="accent-gradient-svg" height={0} width={0}>
        <linearGradient id="accent-gradient" x1={1} x2={1} y1={0} y2={1}>
            <stop offset={0} stop-color="var(--secondary)" />
            <stop offset={1} stop-color="var(--primary)" />
        </linearGradient>
    </svg>

    <Notifications />

    {#if newVersionAvailable}
        <NewVersionAvailable {newVersion} />
    {/if}

    <Modal classContent="popup-background" classWindow="popup-background" show={$popup} />

    <slot />

    <Footer />
</div>

<style lang="less">
    @import '../styles/variables';

    :global(html),
    :global(body) {
        width: 100%;
        margin: 0;
        padding: 0;
        overflow-y: hidden;
    }

    .root {
        // scroll inside root so that the scrollbar is styled
        // with correct theme
        height: 100vh;
        background: var(--background-color);
        padding: 0;
        overflow-y: scroll;
        overflow-x: hidden;
    }
</style>
