<script lang="ts">
    import AllowCookies from '$lib/components/AllowCookies.svelte';
    import { Auth } from '$lib/controllers/auth/auth';
    import { BackupControllerClient } from '$lib/controllers/backup/backup';
    import type { LayoutData } from './$types';
    import { onDestroy } from 'svelte';
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
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
    import Nav from '$lib/components/Nav.svelte';
    import PasscodeModal from '$lib/components/dialogs/PasscodeModal.svelte';

    export let data: LayoutData;

    function checkObfuscatedTimeout() {
        // === true to get around a weird TS + Svelte bug
        if ($obfuscated === true) return;

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
        showPasscodeModal = secondsSinceLastEntered > $settingsStore.passcodeTimeout.value;
    }

    function activity() {
        lastActivity = nowUtc();
    }

    async function downloadBackup() {
        if (downloadingBackup) return;
        downloadingBackup = true;
        const { data: backupData } = notify.onErr(await api.get('/backups', { encrypted: 1 }));
        BackupControllerClient.download(backupData, $username, true);
        downloadingBackup = false;
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

            if (e.key === 's') {
                void downloadBackup();
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

    let downloadingBackup = false;

    let intervalId: number | null = null;
    $: if ($page && browser) {
        if (intervalId !== null) {
            window.clearInterval(intervalId);
        }
        intervalId = window.setInterval(() => {
            checkObfuscatedTimeout();
            checkPasscode($passcodeLastEntered);
            checkDayDifferent();
        }, 1000);
    }

    onDestroy(() => {
        if (intervalId !== null) {
            window.clearInterval(intervalId);
        }
    });

    $: if (!$username) void Auth.logOut(true);
    $: if (!$encryptionKey) void Auth.logOut(true);

    passcodeLastEntered.subscribe(v => void checkPasscode(v));

    $: currentlyShowPasscodeModal =
        $settingsStore.passcode.value &&
        nowUtc() - ($passcodeLastEntered || 0) > $settingsStore.passcodeTimeout.value &&
        showPasscodeModal &&
        ($settingsStore.passcodeTimeout.value > 0 || !$passcodeLastEntered || !browser);
</script>

<svelte:window
    on:keydown|nonpassive={keydown}
    on:mousemove|passive={activity}
    on:scroll|passive={activity}
/>

<Nav />

{#if currentlyShowPasscodeModal}
    <PasscodeModal bind:show={showPasscodeModal} passcode={$settingsStore.passcode.value} />
{/if}

{#if !$allowedCookies}
    <AllowCookies />
{/if}

<div class="page-content">
    <slot />
</div>

<style lang="less">
    @import '../../styles/variables';

    .page-content {
        min-height: calc(100vh - var(--nav-height));
        margin: 0 1rem 200px 1rem;

        @media @mobile {
            margin: 0 5px 200px 5px;
        }
    }
</style>
