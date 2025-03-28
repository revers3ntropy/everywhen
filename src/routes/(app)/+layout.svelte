<script lang="ts">
    import { afterNavigate, beforeNavigate } from '$app/navigation';
    import AllowCookies from '$lib/components/auth/AllowCookies.svelte';
    import { Auth } from '$lib/controllers/auth/auth';
    import { Result } from '$lib/utils/result';
    import type { LayoutData } from './$types';
    import { onDestroy, onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import {
        allowedCookies,
        encryptionKey,
        obfuscated,
        passcodeLastEntered,
        settingsStore,
        username
    } from '$lib/stores';
    import { notify } from '$lib/components/notifications/notifications';
    import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
    import Nav from '$lib/components/nav/Nav.svelte';
    import PasscodeModal from '$lib/components/auth/PasscodeModal.svelte';

    export let data: LayoutData;

    function checkObfuscatedTimeout() {
        if ($obfuscated) return;

        const hideAfter = $settingsStore.autoHideEntriesDelay.value;
        if (hideAfter < 1) return;

        if (nowUtc() - lastActivity >= hideAfter) {
            notify.info('Blurred due to inactivity', 10_000);
            obfuscated.set(true);
        }
    }

    function checkPasscode(lastEntered: number | null) {
        if (lastEntered === null) return;
        const secondsSinceLastEntered = nowUtc() - lastEntered;
        showPasscodeModal = secondsSinceLastEntered > $settingsStore?.passcodeTimeout?.value;
    }

    function activity() {
        lastActivity = nowUtc();
    }

    function keydown(e: KeyboardEvent) {
        lastActivity = nowUtc();

        if (e.key === 'Pause') {
            obfuscated.set(!$obfuscated);
            e.preventDefault();
            return;
        }

        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'Escape') {
                obfuscated.set(!$obfuscated);
                e.preventDefault();
                return;
            }
        }
    }

    function checkDayDifferent() {
        if (day !== fmtUtc(nowUtc(), currentTzOffset(), 'YYYY-MM-DD')) {
            location.reload();
        }
    }

    const day = fmtUtc(nowUtc(), currentTzOffset(), 'YYYY-MM-DD');

    let lastActivity = nowUtc();

    let showPasscodeModal = true;

    let mounted = false;
    let intervalId: number | null = null;
    $: if ($page && browser && mounted) {
        if (intervalId !== null) window.clearInterval(intervalId);
        intervalId = window.setInterval(() => {
            checkObfuscatedTimeout();
            checkPasscode($passcodeLastEntered);
            checkDayDifferent();
        }, 1000);
    }

    onMount(() => {
        mounted = true;
    });

    onDestroy(() => {
        if (intervalId !== null) {
            window.clearInterval(intervalId);
        }
    });

    let navigating = false;
    let finishedNavigation = false;
    beforeNavigate(() => {
        navigating = true;
        finishedNavigation = false;
    });
    afterNavigate(() => {
        navigating = false;
        finishedNavigation = true;

        setTimeout(() => {
            finishedNavigation = false;
        }, 100);
    });

    $: if (browser && (!$username || !$encryptionKey)) {
        void Auth.logOut(true);
    }

    passcodeLastEntered.subscribe(value => {
        if (browser) checkPasscode(value);
    });

    $: currentlyShowPasscodeModal =
        $settingsStore?.passcode?.value &&
        nowUtc() - ($passcodeLastEntered || 0) > $settingsStore?.passcodeTimeout?.value &&
        showPasscodeModal &&
        ($settingsStore?.passcodeTimeout?.value > 0 || !$passcodeLastEntered || !browser);
</script>

<svelte:window
    on:keydown|nonpassive={keydown}
    on:mousemove|passive={activity}
    on:scroll|passive={activity}
/>

{#if currentlyShowPasscodeModal}
    <PasscodeModal bind:show={showPasscodeModal} passcode={$settingsStore.passcode.value} />
{/if}

{#if !(browser ? $allowedCookies : Result.tryJsonParse(data.__cookieWritables.allowedCookies).or(false))}
    <AllowCookies />
{/if}

<span class="nav-loader-wrapper">
    <span class="nav-loader" class:navigating class:finished-navigation={finishedNavigation} />
</span>

<div class="md:fixed top-0 md:left-0 right-0 md:bottom-0 md:h-full w-[12rem] z-[6]">
    <Nav
        activeSubscriptionType={data.activeSubscriptionType}
        locations={data.locations}
        labels={data.labels}
    />
</div>

<div class="page-content">
    <slot />
</div>

<style lang="scss">
    .page-content {
        min-height: 100vh;
        padding: 0 0 200px 12rem;

        @media #{$mobile} {
            padding: 0 0 200px 0;
        }
    }

    .nav-loader-wrapper {
        width: 100%;

        .nav-loader {
            width: 0;
            height: 3px;
            position: fixed;
            top: 0;
            background: var(--primary);
            transition: width 12s cubic-bezier(0, 1, 0.5, 0.5);
            z-index: 10000;

            &.navigating {
                width: 100%;
            }

            &.finished-navigation {
                display: none;
            }
        }
    }
</style>
