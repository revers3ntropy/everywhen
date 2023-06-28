<script lang="ts">
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import Notifications from '$lib/components/notifications/Notifications.svelte';
    import { parse } from 'cookie';
    import { onMount } from 'svelte';
    import { ANIMATION_DURATION, USERNAME_COOKIE_KEY } from '$lib/constants';
    import { Backup } from '$lib/controllers/backup';
    import { obfuscated, passcodeLastEntered } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { GETParamIsFalsy } from '$lib/utils/GETArgs';
    import { errorLogger } from '$lib/utils/log';
    import {
        displayNotifOnErr,
        notify
    } from '$lib/components/notifications/notifications';
    import { nowUtc } from '$lib/utils/time';
    import Nav from '$lib/components/Nav.svelte';
    import PasscodeModal from '$lib/components/dialogs/PasscodeModal.svelte';
    import { blur } from 'svelte/transition';
    import type { LayoutData } from './$types';

    export let data: LayoutData;

    function checkObfuscatedTimeout() {
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
        if (lastEntered === null) return;

        const secondsSinceLastEntered = nowUtc() - lastEntered;
        showPasscodeModal =
            secondsSinceLastEntered > data.settings.passcodeTimeout.value;
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

    let lastActivity = nowUtc();

    $: obfuscated.set(data.settings.hideEntriesByDefault.value);

    $: if (GETParamIsFalsy($page.url.searchParams.get('obfuscate'))) {
        obfuscated.set(false);
    }

    let showPasscodeModal = true;

    let downloadingBackup = false;

    onMount(() => {
        setInterval(() => {
            void checkCookies();
            checkObfuscatedTimeout();
            checkPasscode($passcodeLastEntered);
        }, 1000);
    });

    passcodeLastEntered.subscribe(v => void checkPasscode(v));
</script>

<svelte:window
    on:keydown|nonpassive={keydown}
    on:mousemove|passive={activity}
    on:scroll|passive={activity}
/>

<Notifications />

{#if data.settings.passcode.value && nowUtc() - ($passcodeLastEntered || 0) > data.settings.passcodeTimeout.value && showPasscodeModal && !home && (data.settings.passcodeTimeout.value > 0 || !$passcodeLastEntered || !browser)}
    <PasscodeModal
        bind:show={showPasscodeModal}
        passcode={data.settings.passcode.value}
        auth={data}
    />
{/if}

<Nav auth={data} settings={data.settings} />

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

<style lang="less">
    @import '../../styles/variables';

    .page-content {
        min-height: calc(100vh - var(--nav-height));
        padding: 0 1rem 4rem 1rem;

        @media @mobile {
            padding: 0 5px 200px 5px;
        }
    }
</style>
