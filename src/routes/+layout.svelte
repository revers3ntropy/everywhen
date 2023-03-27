<script lang="ts">
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import { parse } from 'cookie';
    import { onMount } from 'svelte';
    import Notifications from 'svelte-notifications';
    import Modal from 'svelte-simple-modal';
    import 'ts-polyfill';
    import '../app.less';
    import { USERNAME_COOKIE_KEY } from '../lib/constants';
    import { obfuscated, passcodeLastEntered, popup } from '../lib/stores';
    import { INFO_NOTIFICATION } from '../lib/utils/notifications';
    import { nowS } from '../lib/utils/time';
    import type { NotificationOptions } from '../lib/utils/types';
    import Footer from './Footer.svelte';
    import Nav from './Nav.svelte';
    import Notifier from './Notifier.svelte';
    import PasscodeModal from './PasscodeModal.svelte';

    $: home = $page.url.pathname.trim() === '/';

    export let data: App.PageData;

    let lastActivity = nowS();

    let addNotification: <T>(props: Record<string, T> | NotificationOptions) => void;
    let isObfuscated: boolean;
    $: isObfuscated = data.settings.hideEntriesByDefault.value;
    $: obfuscated.update(() => isObfuscated);

    let showPasscodeModal = true;

    function checkObfuscatedTimeout () {
        if (isObfuscated) return;

        const hideAfter = data.settings.autoHideEntriesDelay.value;
        if (hideAfter < 1) return;

        if (nowS() - lastActivity >= hideAfter) {
            addNotification({
                ...INFO_NOTIFICATION,
                removeAfter: -1,
                text: 'Hidden due to inactivity',
            });
            isObfuscated = true;
        }
    }

    function checkCookies () {
        const cookies = parse(document.cookie);

        // the key cookie is HttpOnly, so we can't read it from JS
        // https://owasp.org/www-community/HttpOnly
        if (!cookies[USERNAME_COOKIE_KEY]) {
            console.error('Cookies have expired');
            window.location.assign('/');
        }
    }

    function checkPasscode () {
        const secondsSinceLastEntered = nowS() - $passcodeLastEntered;

        showPasscodeModal = secondsSinceLastEntered > data.settings.passcodeTimeout.value;
    }

    onMount(() => {
        setInterval(() => {
            if (home) return;

            checkObfuscatedTimeout();
            checkCookies();
            checkPasscode();
        }, 1000);
    });


    function activity () {
        lastActivity = nowS();
    }

    function keydown (e: KeyboardEvent) {
        lastActivity = nowS();
        if (e.key === 'Escape') {
            if (e.ctrlKey) {
                isObfuscated = !isObfuscated;
                e.preventDefault();
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
    <title>Diary</title>
    <meta content="Diary" name="description" />
</svelte:head>

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
        <Nav auth={data} />
    {/if}

    <div style="min-height: calc(100vh - var(--nav-height))">
        <slot />
    </div>

    <Modal
        classContent="popup-background"
        classWindow="popup-background"
        show={$popup}
    />

    <Footer />
</Notifications>
