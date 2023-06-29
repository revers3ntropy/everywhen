<script lang="ts">
    import { POLL_FOR_UPDATE_INTERVAL } from '$lib/constants';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import Modal from 'svelte-simple-modal';
    import '../app.less';
    import { popup, theme } from '$lib/stores';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';
    import NewVersionAvailable from '$lib/components/NewVersionAvailable.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

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

<svg class="accent-gradient-svg" height={0} width={0}>
    <linearGradient id="accent-gradient" x1={1} x2={1} y1={0} y2={1}>
        <stop offset={0} stop-color="var(--secondary)" />
        <stop offset={1} stop-color="var(--primary)" />
    </linearGradient>
</svg>

<div data-sveltekit-preload-data="hover" data-theme={$theme} class="root">
    <slot />

    {#if newVersionAvailable}
        <NewVersionAvailable {newVersion} />
    {/if}

    <Modal classContent="popup-background" classWindow="popup-background" show={$popup} />

    <Footer />
</div>

<style lang="less">
    @import '../styles/variables';

    :global(html),
    :global(body) {
        width: 100%;
        margin: 0;
        padding: 0;
    }

    .root {
        height: fit-content;
        min-height: 100vh;
        background: var(--background-color);
        padding: 0;

        @media @mobile {
            padding: 4px;
        }
    }
</style>
