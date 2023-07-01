<script lang="ts">
    import { goto } from '$app/navigation';
    import { Settings } from '$lib/controllers/settings/settings';
    import { populateCookieWritablesWithCookies } from '$lib/stores';
    import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
    import Cookie from 'js-cookie';
    import { encryptionKeyFromPassword } from '$lib/security/authUtils';
    import { api } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import type { PageData } from './$types';

    export let data: PageData;

    // user log in / create account form values
    let password = '';
    let username = '';

    let actionPending = false;

    async function login(): Promise<void> {
        actionPending = true;
        const auth = displayNotifOnErr(
            await api.get(null, '/auth', {
                key: encryptionKeyFromPassword(password),
                username
            }),
            () => (actionPending = false)
        );

        const cookies = Cookie.get() as RawCookies;
        const { settings: rawSettings } = displayNotifOnErr(
            await api.get(auth, '/settings'),
            () => (actionPending = false)
        );
        const settings = Settings.convertToMap(rawSettings);

        populateCookieWritablesWithCookies(cookies, settings);

        await goto('/' + data.redirect);
    }
</script>

<main class="flex-center">
    <div class="content">
        <label>
            Username
            <input
                aria-label="Username"
                autocomplete="username"
                bind:value={username}
                disabled={actionPending}
                style="font-size: x-large"
            />
        </label>
        <label>
            Password
            <input
                aria-label="Password"
                autocomplete="current-password"
                bind:value={password}
                disabled={actionPending}
                style="font-size: x-large"
                type="password"
            />
        </label>
        <div class="flex-center" style="justify-content: space-between">
            <a
                aria-label="Create Account"
                href="/signup/?redirect={encodeURIComponent(data.redirect)}"
            >
                Sign Up
            </a>
            <button
                aria-label="Log In"
                class="primary with-icon"
                disabled={actionPending}
                on:click|preventDefault={login}
                type="button"
            >
                <ChevronRight size="30" />
                Log In
            </button>
        </div>
    </div>
</main>

<style lang="less">
    @import '../../../styles/layout';

    main {
        .flex-center();
        height: 100vh;
    }

    .content,
    input {
        max-width: 94vw;
    }

    label {
        display: flex;
        flex-direction: column;
        margin: 1rem 0;
    }
</style>
