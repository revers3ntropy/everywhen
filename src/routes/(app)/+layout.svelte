<script lang="ts">
    import AllowCookies from '$lib/components/AllowCookies.svelte';
    import { clientLogger } from '$lib/utils/log';
    import type { LayoutData } from './$types';
    import { logOut } from '$lib/security/logOut';
    import { onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import Cookie from 'js-cookie';
    import { STORE_KEY } from '$lib/constants';
    import { Backup } from '$lib/controllers/backup/backup.client';
    import { allowedCookies, obfuscated, passcodeLastEntered, settingsStore } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { displayNotifOnErr, notify } from '$lib/components/notifications/notifications';
    import { nowUtc } from '$lib/utils/time';
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

    async function checkCookies() {
        // the key cookie is HttpOnly, so we can't read it from JS
        // https://owasp.org/www-community/HttpOnly
        if (!Cookie.get(STORE_KEY.username)) {
            clientLogger.error('Cookies have expired');
            await logOut(true);
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
        const { data: backupData } = displayNotifOnErr(
            await api.get(data.auth, '/backups', { encrypted: 1 })
        );
        Backup.download(backupData, data.auth.username, true);
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

    let lastActivity = nowUtc();

    let showPasscodeModal = true;

    let downloadingBackup = false;

    let intervalId: number | null = null;
    $: if ($page && browser) {
        if (intervalId !== null) {
            window.clearInterval(intervalId);
        }
        intervalId = window.setInterval(() => {
            void checkCookies();
            checkObfuscatedTimeout();
            checkPasscode($passcodeLastEntered);
        }, 1000);
    }

    onDestroy(() => {
        if (intervalId !== null) {
            window.clearInterval(intervalId);
        }
    });

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

<Nav auth={data.auth} />

{#if currentlyShowPasscodeModal}
    <PasscodeModal
        bind:show={showPasscodeModal}
        passcode={$settingsStore.passcode.value}
        auth={data.auth}
    />
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
