<script lang="ts">
    import { goto } from '$app/navigation';
    import { NORMAL_COOKIE_TIMEOUT_DAYS, REMEMBER_ME_COOKIE_TIMEOUT_DAYS } from '$lib/constants';
    import { Auth } from '$lib/controllers/auth/auth';
    import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';
    import type { PageData } from './$types';
    import { tooltip } from '@svelte-plugins/tooltips';
    import { encryptionKey, username as usernameStore } from '$lib/stores';

    export let data: PageData;
    const { redirect } = data;

    async function login(): Promise<void> {
        actionPending = true;

        const key = Auth.encryptionKeyFromPassword(password.value);

        $encryptionKey = key;

        notify.onErr(
            await api.get(
                '/auth',
                {
                    key,
                    username: username.value,
                    rememberMe: rememberMeInput.checked
                },
                { doNotEncryptBody: true, doNotLogoutOn401: true }
            ),
            () => {
                actionPending = false;
                $encryptionKey = '';
            }
        );

        $usernameStore = username.value;
        await Auth.populateCookiesAndSettingsAfterAuth(() => (actionPending = false));

        await goto('/' + redirect);
    }

    function usernameInputKeypress(event: { code: string }) {
        if (event.code === 'Enter') {
            if (password.value) {
                void login();
                return;
            }
            password.focus();
        }
    }

    function passwordInputKeypress(event: { code: string }) {
        if (event.code === 'Enter') {
            void login();
        }
    }

    // user log in / create account form values
    let password: HTMLInputElement;
    let username: HTMLInputElement;
    let rememberMeInput: HTMLInputElement;
    let actionPending = false;

    // stop the user getting stuck on this page if the redirect after login fails
    $: if ($encryptionKey && $usernameStore) {
        void goto('/' + redirect);
    }
</script>

<svelte:head>
    <title>Log In</title>
    <meta content="Log in to Everywhen" name="description" />
</svelte:head>

<main class="flex-center">
    <div class="content">
        <label>
            Username
            <input
                aria-label="Username"
                autocomplete="username"
                bind:this={username}
                disabled={actionPending}
                style="font-size: x-large"
                on:keypress={usernameInputKeypress}
            />
        </label>
        <label>
            Password
            <input
                aria-label="Password"
                autocomplete="current-password"
                bind:this={password}
                disabled={actionPending}
                style="font-size: x-large"
                type="password"
                on:keypress={passwordInputKeypress}
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
                        `days instead of ${NORMAL_COOKIE_TIMEOUT_DAYS * 24} hours.`
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
                class="primary flex-center gap-1"
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

<style lang="scss">
    @import '$lib/styles/layout';

    main {
        @extend .flex-center;
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
