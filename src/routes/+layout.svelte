<script lang="ts">
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import Notifications from '$lib/notifications/Notifications.svelte';
    import { parse } from 'cookie';
    import { onMount } from 'svelte';
    import Modal from 'svelte-simple-modal';
    import 'ts-polyfill';
    import '../app.less';
    import {
        ANIMATION_DURATION,
        NON_AUTH_ROUTES,
        USERNAME_COOKIE_KEY
    } from '$lib/constants';
    import { Backup } from '$lib/controllers/backup';
    import { obfuscated, passcodeLastEntered, popup } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { GETParamIsFalsy } from '$lib/utils/GETArgs';
    import { errorLogger } from '$lib/utils/log';
    import {
        displayNotifOnErr,
        notify
    } from '$lib/notifications/notifications';
    import { nowUtc } from '$lib/utils/time';
    import Footer from './Footer.svelte';
    import Nav from './Nav.svelte';
    import NewVersionAvailable from './NewVersionAvailable.svelte';
    import NoAuthNav from './NoAuthNav.svelte';
    import PasscodeModal from './PasscodeModal.svelte';
    import { blur } from 'svelte/transition';
    import type { PageData } from './$types';

    $: home = $page.url.pathname.trim() === '/';
    $: requireAuth = !NON_AUTH_ROUTES.includes($page.url.pathname);

    export let data: PageData;

    let lastActivity = nowUtc();

    $: obfuscated.set(data.settings.hideEntriesByDefault.value);

    $: if (GETParamIsFalsy($page.url.searchParams.get('obfuscate'))) {
        obfuscated.set(false);
    }

    $: $page && popup.set(null);

    let showPasscodeModal = true;
    let newVersionAvailable = false;
    let newVersion = '<error>';
    let downloadingBackup = false;

    onMount(() => {
        setInterval(() => {
            if (home) return;
            void checkCookies();
            checkObfuscatedTimeout();
            checkPasscode($passcodeLastEntered);
        }, 1000);

        setInterval(() => {
            void checkForUpdate();
        }, 1000 * 30);
    });

    passcodeLastEntered.subscribe(v => void checkPasscode(v));

    function checkObfuscatedTimeout() {
        if (!requireAuth) return;
        // === true to get around a weird TS + Svelte bug
        if ($obfuscated === true) return;

        const hideAfter = data.settings.autoHideEntriesDelay.value;
        if (hideAfter < 1) return;

        if (nowUtc() - lastActivity >= hideAfter) {
            notify.info('Blurred due to inactivity', 10_000);
            obfuscated.set(true);
        }
    }

    async function checkCookies() {
        if (!requireAuth) return;

        const cookies = parse(document.cookie);

        // the key cookie is HttpOnly, so we can't read it from JS
        // https://owasp.org/www-community/HttpOnly
        if (!cookies[USERNAME_COOKIE_KEY]) {
            errorLogger.error('Cookies have expired');
            await goto(
                '/?redirect=' +
                    encodeURIComponent(
                        location.pathname.substring(1) + location.search
                    )
            );
        }
    }

    function checkPasscode(lastEntered: number | null) {
        if (!requireAuth) return;
        if (lastEntered === null) return;

        const secondsSinceLastEntered = nowUtc() - lastEntered;
        showPasscodeModal =
            secondsSinceLastEntered > data.settings.passcodeTimeout.value;
    }

    async function checkForUpdate() {
        const currentVersion = __VERSION__;
        const versionResult = displayNotifOnErr(
            await api.get(data, '/version')
        );

        newVersionAvailable = versionResult.v !== currentVersion;
        newVersion = versionResult.v;
    }

    function activity() {
        lastActivity = nowUtc();
    }

    async function downloadBackup() {
        if (downloadingBackup) return;
        downloadingBackup = true;
        const { data: backupData } = displayNotifOnErr(
            await api.get(data, '/backups', { encrypted: 1 })
        );
        Backup.download(backupData, data.username, true);
        downloadingBackup = false;
    }

    function keydown(e: KeyboardEvent) {
        lastActivity = nowUtc();
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'Escape') {
                obfuscated.set(!$obfuscated);
                e.preventDefault();
                return;
            }

            if (e.key === 's') {
                void downloadBackup();
                e.preventDefault();
                return;
            }
        }
    }
</script>

<svelte:window
    on:keydown|nonpassive={keydown}
    on:mousemove|passive={activity}
    on:scroll|passive={activity}
/>

<svelte:head>
    <title>Halcyon.Land</title>
    <meta content="Journal and Life Logging app" name="description" />

    <link href="https://fonts.googleapis.com" rel="preconnect" />
    <link
        crossorigin="anonymous"
        href="https://fonts.gstatic.com"
        rel="preconnect"
    />
    <link
        href="https://fonts.googleapis.com/css2?family=Quicksand&family=Dosis&family=Edu+NSW+ACT+Foundation:wght@500&family=Raleway:wght@300&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<svg class="accent-gradient-svg" height={0} width={0}>
    <linearGradient id="accent-gradient" x1={1} x2={1} y1={0} y2={1}>
        <stop offset={0} stop-color="rgb(121, 235, 226)" />
        <stop offset={1} stop-color="rgb(189, 176, 255)" />
    </linearGradient>
</svg>

<div
    data-sveltekit-preload-data="hover"
    data-theme={data.settings.darkMode.value === true ? 'dark' : 'light'}
    class="root"
>
    <Notifications />

    {#if data.settings.passcode.value && nowUtc() - ($passcodeLastEntered || 0) > data.settings.passcodeTimeout.value && showPasscodeModal && !home && (data.settings.passcodeTimeout.value > 0 || !$passcodeLastEntered || !browser)}
        <PasscodeModal
            bind:show={showPasscodeModal}
            passcode={data.settings.passcode.value}
            auth={data}
        />
    {/if}

    {#if !home}
        {#if data.id}
            <Nav auth={data} settings={data.settings} />
        {:else}
            <NoAuthNav />
        {/if}
    {/if}

    {#key data.path}
        <div
            class="page-content"
            in:blur|global={{
                // half as total = in + out
                duration: ANIMATION_DURATION * 0.5,
                delay: ANIMATION_DURATION * 0.5
            }}
            out:blur|global={{
                duration: ANIMATION_DURATION * 0.5
            }}
        >
            <slot />
        </div>
    {/key}

    {#if newVersionAvailable}
        <NewVersionAvailable {newVersion} />
    {/if}

    <Modal
        classContent="popup-background"
        classWindow="popup-background"
        show={$popup}
    />

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
        background: var(--bg);
        padding: 0;

        @media @mobile {
            padding: 4px;
        }
    }

    .page-content {
        min-height: calc(100vh - var(--nav-height));
        padding: 0 1rem 4rem 1rem;

        @media @mobile {
            padding: 0 5px 200px 5px;
        }
    }
</style>
