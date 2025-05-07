<script lang="ts">
    import { goto } from '$app/navigation';
    import { Button } from '$lib/components/ui/button';
    import Logo from '$lib/components/ui/Logo.svelte';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { Auth } from '$lib/controllers/auth/auth';
    import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import type { PageData } from './$types';
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

<main class="flex-center h-screen">
    <div class="px-2">
        <section class="pb-4 md:flex md:justify-center">
            <p class="text-left title-font text-3xl pb-4 flex items-center gap-2 w-fit">
                <Logo scale={0.1} /> Everywhen
            </p>
        </section>
        <section class="md:border rounded-xl md:p-6 md:pt-4 md:bg-vLightAccent">
            <p class="text-left text-md pb-2">Login to continue</p>

            <Textbox
                autocomplete="username"
                disabled={actionPending}
                on:keypress={usernameInputKeypress}
                bind:element={username}
                label="Username"
                autofocus
                id="username"
            />
            <Textbox
                autocomplete="current-password"
                disabled={actionPending}
                on:keypress={passwordInputKeypress}
                bind:element={password}
                label="Password"
                type="password"
                id="password"
            />
            <div class="py-4 text-right">
                <input type="checkbox" bind:this={rememberMeInput} />
                <button
                    class="flex-center oneline text-light"
                    style="display: inline-flex; gap: 4px"
                    on:click={() => (rememberMeInput.checked = !rememberMeInput.checked)}
                >
                    Remember me
                </button>
            </div>
            <div class="flex-center" style="justify-content: space-between">
                <a
                    aria-label="Create Account"
                    href="/signup/?redirect={encodeURIComponent(data.redirect)}"
                >
                    Sign Up
                </a>
                <Button
                    aria-label="Log In"
                    class="primary flex-center gap-1"
                    disabled={actionPending}
                    on:click={login}
                    type="button"
                >
                    <ChevronRight size="30" />
                    Log In
                </Button>
            </div>
        </section>
    </div>
</main>
