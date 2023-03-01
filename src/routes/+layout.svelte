<script lang="ts">
    import { page } from '$app/stores';
    import Notifications from 'svelte-notifications';
    import Modal from 'svelte-simple-modal';
    import 'ts-polyfill';
    import type { App } from '../app';
    import '../app.less';
    import Header from '../lib/components/Nav.svelte';
    import { INACTIVE_TIMEOUT_MS, obfuscated } from '../lib/constants';
    import { popup } from '../lib/constants.js';
    import Notifier from './Notifier.svelte';

    export let data: App.PageData;

    $: home = $page.url.pathname.trim() === '/';

    let lastActivity = Date.now();

    let addNotification;
    let isObfuscated = true;
    $: obfuscated.update(() => isObfuscated);

    setInterval(() => {
        if (isObfuscated) {
            return;
        }

        if (Date.now() - lastActivity > INACTIVE_TIMEOUT_MS) {
            addNotification({
                text: 'Hidden due to inactivity',
                type: 'info',
                removeAfter: 4000,
            });
            isObfuscated = true;
        }
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
        <Header user={data} />
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
