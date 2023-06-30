<script lang="ts">
    import '../app.less';
    import type { PageData } from './$types';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
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
    populateCookieWritablesWithCookies(data.__cookieWritables);

    async function checkForUpdate() {
        const currentVersion = __VERSION__;
        const versionResult = displayNotifOnErr(await api.get(null, '/version'));

        newVersionAvailable = versionResult.v !== currentVersion;
        newVersion = versionResult.v;
    }

    onMount(() => {
        setInterval(() => {
            void checkForUpdate();
        }, POLL_FOR_UPDATE_INTERVAL);
    });

    let newVersionAvailable = false;
    let newVersion = '<error>';

    $: $page && popup.set(null);
</script>

<svelte:head>
    <title>Halcyon.Land</title>
    <meta content="Journal and Life Logging app" name="description" />

    <link href="https://fonts.googleapis.com" rel="preconnect" />
    <link crossorigin="anonymous" href="https://fonts.gstatic.com" rel="preconnect" />
    <link
        href="https://fonts.googleapis.com/css2?family=Quicksand&family=Dosis&family=Edu+NSW+ACT+Foundation:wght@500&family=Raleway:wght@300&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<div data-sveltekit-preload-data="hover" data-theme={$theme} class="root">
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
