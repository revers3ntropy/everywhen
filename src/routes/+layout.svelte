<script lang="ts">
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import { parse } from 'cookie';
    import { onMount } from 'svelte';
    import Notifications from 'svelte-notifications';
    import Modal from 'svelte-simple-modal';
    import 'ts-polyfill';
    import '../app.less';
    import { NON_AUTH_ROUTES, USERNAME_COOKIE_KEY } from '../lib/constants';
    import { Backup } from '../lib/controllers/backup';
    import { obfuscated, passcodeLastEntered, popup } from '../lib/stores';
    import { api } from '../lib/utils/apiRequest';
    import { GETParamIsFalsy } from '../lib/utils/GETArgs';
    import { displayNotifOnErr, INFO_NOTIFICATION } from '../lib/utils/notifications';
    import { nowS } from '../lib/utils/time';
    import type { NotificationOptions } from '../lib/utils/types';
    import Footer from './Footer.svelte';
    import Nav from './Nav.svelte';
    import NewVersionAvailable from './NewVersionAvailable.svelte';
    import NoAuthNav from './NoAuthNav.svelte';
    import Notifier from './Notifier.svelte';
    import PasscodeModal from './PasscodeModal.svelte';

    $: home = $page.url.pathname.trim() === '/';
    $: requireAuth = !NON_AUTH_ROUTES.includes($page.url.pathname);

    export let data: App.PageData;

    let lastActivity = nowS();

    let addNotification: <T>(props: Record<string, T> | NotificationOptions) => void;

    $: obfuscated.set(data.settings.hideEntriesByDefault.value);

    $: if (GETParamIsFalsy($page.url.searchParams.get('obfuscate'))) {
        obfuscated.set(false);
    }

    $: $page && popup.set(null);

    let showPasscodeModal = true;
    let newVersionAvailable = false;
    let newVersion = '<error>';
    let downloadingBackup = false;

    function checkObfuscatedTimeout () {
        if (!requireAuth) return;
        if ($obfuscated) return;

        const hideAfter = data.settings.autoHideEntriesDelay.value;
        if (hideAfter < 1) return;

        if (nowS() - lastActivity >= hideAfter) {
            addNotification({
                ...INFO_NOTIFICATION,
                removeAfter: 0,
                text: 'Hidden due to inactivity',
            });
            $obfuscated = true;
        }
    }

    function checkCookies () {
        if (!requireAuth) return;

        const cookies = parse(document.cookie);

        // the key cookie is HttpOnly, so we can't read it from JS
        // https://owasp.org/www-community/HttpOnly
        if (!cookies[USERNAME_COOKIE_KEY]) {
            console.error('Cookies have expired');
            location.assign('/?redirect=' + encodeURIComponent(location.pathname.substring(1) + location.search));
        }
    }

    function checkPasscode () {
        if (!requireAuth) return;

        const secondsSinceLastEntered = nowS() - $passcodeLastEntered;
        showPasscodeModal = secondsSinceLastEntered > data.settings.passcodeTimeout.value;
    }

    async function checkForUpdate () {
        const currentVersion = __VERSION__;
        const versionResult = displayNotifOnErr(addNotification,
            await api.get(data, '/version'),
        );

        newVersionAvailable = versionResult.version !== currentVersion;
        newVersion = versionResult.version;
    }

    onMount(() => {
        setInterval(() => {
            if (home) return;

            checkObfuscatedTimeout();
            checkCookies();
            checkPasscode();
        }, 1000);

        setInterval(() => {
            void checkForUpdate();
        }, 1000 * 10);
    });


    function activity () {
        lastActivity = nowS();
    }

    async function downloadBackup () {
        if (downloadingBackup) return;
        downloadingBackup = true;
        const { data: backupData } = displayNotifOnErr(addNotification,
            await api.get(data, '/backups', { encrypted: 1 }),
        );
        Backup.download(backupData, data.username, true);
        downloadingBackup = false;
    }

    function keydown (e: KeyboardEvent) {
        lastActivity = nowS();
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
    <meta content="Halcyon.Land - Journal and Life Logging" name="description" />

    <link href="https://fonts.googleapis.com" rel="preconnect">
    <link crossorigin="anonymous" href="https://fonts.gstatic.com" rel="preconnect">
    <link
        href="https://fonts.googleapis.com/css2?family=Quicksand&family=Dosis&family=Edu+NSW+ACT+Foundation:wght@500&family=Raleway:wght@300&display=swap"
        rel="stylesheet"
    >
</svelte:head>

<svg class="accent-gradient-svg" height={0} width={0}>
    <linearGradient id="accent-gradient" x1={1} x2={1} y1={0} y2={1}>
        <stop offset={0} stop-color="rgb(121, 235, 226)" />
        <stop offset={1} stop-color="rgb(189, 176, 255)" />
    </linearGradient>
</svg>

<Notifications>

    {#if data.settings.passcode.value
    && nowS() - $passcodeLastEntered > data.settings.passcodeTimeout.value
    && showPasscodeModal
    && !home
    && (data.settings.passcodeTimeout.value > 0
        || !$passcodeLastEntered
        || !browser)
    }
        <PasscodeModal
            bind:show={showPasscodeModal}
            passcode={data.settings.passcode.value}
        />
    {/if}

    <Notifier bind:addNotification />

    {#if !home}
        {#if data.id}
            <Nav auth={data} />
        {:else}
            <NoAuthNav />
        {/if}
    {/if}

    <div style="min-height: calc(100vh - var(--nav-height))">
        <slot />
    </div>

    {#if newVersionAvailable}
        <NewVersionAvailable {newVersion} />
    {/if}

    <Modal
        classContent="popup-background"
        classWindow="popup-background"
        show={$popup}
    />

    <Footer />
</Notifications>
