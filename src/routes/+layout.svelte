<script lang="ts">
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import { parse } from 'cookie';
    import Notifications from 'svelte-notifications';
    import Modal from 'svelte-simple-modal';
    import 'ts-polyfill';
    import '../app.less';
    import Nav from '../lib/components/Nav.svelte';
    import { INACTIVE_TIMEOUT_MS, USERNAME_COOKIE_KEY } from '../lib/constants';
    import { obfuscated, popup } from '../lib/stores';
    import { INFO_NOTIFICATION } from '../lib/utils/notifications';
    import type { NotificationOptions } from '../lib/utils/types';
    import Notifier from './Notifier.svelte';

    $: home = $page.url.pathname.trim() === '/';

    let lastActivity = Date.now();

    let addNotification: <T>(props: Record<string, T> | NotificationOptions) => void;
    let isObfuscated = true;
    $: obfuscated.update(() => isObfuscated);

    function checkObfuscatedTimeout () {
        if (isObfuscated) {
            return;
        }

        if (Date.now() - lastActivity > INACTIVE_TIMEOUT_MS) {
            addNotification({
                ...INFO_NOTIFICATION,
                text: 'Hidden due to inactivity',
            });
            isObfuscated = true;
        }
    }

    function checkCookies () {
        if (!browser) return;
        if (window.location.pathname === '/') return;

        const cookies = parse(document.cookie);

        // the key cookie is HttpOnly, so we can't read it from JS
        // https://owasp.org/www-community/HttpOnly
        if (!cookies[USERNAME_COOKIE_KEY]) {
            console.error('Cookies have expired');
            window.location.assign('/');
        }
    }

    setInterval(() => {
        checkObfuscatedTimeout();
        checkCookies();
    }, 1000);

    function activity () {
        lastActivity = Date.now();
    }

    function keydown (e: KeyboardEvent) {
        lastActivity = Date.now();
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
    <Notifier bind:addNotification />

    {#if !home}
        <Nav />
    {/if}

    <slot />
    <Modal
        classContent="popup-background"
        classWindow="popup-background"
        show={$popup}
    />

    {#if !home}
        <footer></footer>
    {/if}
</Notifications>
