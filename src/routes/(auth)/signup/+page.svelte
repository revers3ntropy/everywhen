<script lang="ts">
    import { goto } from '$app/navigation';
    import { Button } from '$lib/components/ui/button';
    import Logo from '$lib/components/ui/Logo.svelte';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { Auth } from '$lib/controllers/auth/auth';
    import { encryptionKey, username as usernameStore } from '$lib/stores';
    import ArrowRightThinCircleOutline from 'svelte-material-icons/ArrowRightThinCircleOutline.svelte';
    import type { PageData } from './$types';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';

    export let data: PageData;
    const { redirect } = data;

    async function create(): Promise<void> {
        actionPending = true;

        const key = Auth.encryptionKeyFromPassword(password.value);
        encryptionKey.set(key);

        notify.onErr(
            await api.post(
                `/users`,
                {
                    encryptionKey: key,
                    username: username.value
                },
                { doNotEncryptBody: true }
            ),
            () => (actionPending = false)
        );

        usernameStore.set(username.value);

        await Auth.populateCookiesAndSettingsAfterAuth(() => (actionPending = false));

        await goto('/' + redirect);
    }

    function usernameInputKeypress(event: { code: string }) {
        if (event.code === 'Enter') {
            password.focus();
        }
    }

    function passwordInputKeypress(event: { code: string }) {
        if (event.code === 'Enter') {
            void create();
        }
    }

    // user log in / create account form values
    let password: HTMLInputElement;
    let username: HTMLInputElement;

    let actionPending = false;

    // stop the user getting stuck on this page if the redirect after account creation fails
    $: if ($encryptionKey && $usernameStore) {
        void goto('/' + redirect);
    }
</script>

<svelte:head>
    <title>Sign Up</title>
    <meta content="Sign up to Everywhen" name="description" />
</svelte:head>

<main class="flex-center h-screen">
    <div class="px-2">
        <section class="pb-4 md:flex md:justify-center">
            <p class="text-left title-font text-3xl pb-4 flex items-center gap-2 w-fit">
                <Logo scale={0.1} /> Everywhen
            </p>
        </section>
        <section class="md:border rounded-xl md:p-6 md:pt-4 md:bg-vLightAccent">
            <p class="text-left text-md pb-2">Create new account</p>
            <Textbox
                label="Username"
                autocomplete="username"
                bind:element={username}
                disabled={actionPending}
                on:keypress={usernameInputKeypress}
            />
            <Textbox
                label="Password"
                autocomplete="new-password"
                bind:element={password}
                disabled={actionPending}
                on:keypress={passwordInputKeypress}
                type="password"
            />

            <div class="flex-center pt-4" style="justify-content: space-between">
                <a href="/login?redirect={data.redirect}">Log In</a>
                <Button
                    aria-label="Create Account"
                    disabled={actionPending}
                    on:click={create}
                    type="button"
                    class="primary flex-center gap-1"
                >
                    <ArrowRightThinCircleOutline size="25" />
                    Create
                </Button>
            </div>
        </section>
    </div>
</main>
