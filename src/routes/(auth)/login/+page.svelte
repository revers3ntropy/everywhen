<script lang="ts">
    import { goto } from '$app/navigation';
    import { NORMAL_COOKIE_TIMEOUT_DAYS, REMEMBER_ME_COOKIE_TIMEOUT_DAYS } from '$lib/constants';
    import { Auth } from '$lib/controllers/auth/auth';
    import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
    import { api } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';
    import { populateCookiesAndSettingsAfterAuth } from '../actions.client';
    import type { PageData } from './$types';
    import { tooltip } from '@svelte-plugins/tooltips';
    import { encryptionKey, username as usernameStore } from '$lib/stores';

    export let data: PageData;

    async function login(): Promise<void> {
        actionPending = true;

        const key = Auth.encryptionKeyFromPassword(password);

        $encryptionKey = key;

        const auth = displayNotifOnErr(
            await api.get('/auth', {
                key,
                username,
                rememberMe: rememberMeInput.checked
            }),
            () => (actionPending = false)
        );

        $usernameStore = auth.username;
        await populateCookiesAndSettingsAfterAuth(() => (actionPending = false));

        await goto('/' + data.redirect);
    }

    // user log in / create account form values
    let password = '';
    let username = '';
    let rememberMeInput: HTMLInputElement;
    let actionPending = false;
</script>

<svelte:head>
    <title>Log In</title>
    <meta content="Log in to Halcyon.Land" name="description" />
</svelte:head>

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
        <div style="text-align: right; margin-bottom: 1rem">
            <input type="checkbox" bind:this={rememberMeInput} />
            <button
                class="flex-center oneline text-light"
                style="display: inline-flex; gap: 4px"
                use:tooltip={{
                    content:
                        `You will have to re-enter your login details after ${REMEMBER_ME_COOKIE_TIMEOUT_DAYS} ` +
                        `days instead of ${NORMAL_COOKIE_TIMEOUT_DAYS} days.`
                }}
                on:click={() => (rememberMeInput.checked = !rememberMeInput.checked)}
            >
                Remember me
                <span class="flex-center" style="display: inline-flex">
                    <InformationOutline size="20" />
                </span>
            </button>
        </div>
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
    input[type='text'] {
        width: 300px;
    }

    label {
        display: flex;
        flex-direction: column;
        margin: 1rem 0;
    }
</style>
