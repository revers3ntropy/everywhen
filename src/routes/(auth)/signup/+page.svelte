<script lang="ts">
    import AlertCircleOutline from 'svelte-material-icons/AlertCircleOutline.svelte';
    import ArrowRightThinCircleOutline from 'svelte-material-icons/ArrowRightThinCircleOutline.svelte';
    import { slide } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { Button } from '$lib/components/ui/button';
    import Logo from '$lib/components/ui/Logo.svelte';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { Auth } from '$lib/controllers/auth/auth';
    import { encryptionKey, username as usernameStore } from '$lib/stores';
    import type { PageData } from './$types';
    import { api } from '$lib/utils/apiRequest';

    export let data: PageData;

    function resetErrors() {
        usernameError = '';
        passwordError = '';
        formError = '';
    }

    async function create(): Promise<void> {
        submitting = true;
        resetErrors();

        const possibleUsernameError = Auth.usernameIsValid(username.value);
        const possiblePasswordError = Auth.passwordIsValid(password.value);
        if (typeof possibleUsernameError === 'string') {
            usernameError = possibleUsernameError;
        }
        if (typeof possiblePasswordError === 'string') {
            passwordError = possiblePasswordError;
        }
        if (usernameError || passwordError) {
            submitting = false;
            return;
        }

        const key = Auth.encryptionKeyFromPassword(password.value);
        encryptionKey.set(key);

        const getAuthRes = await api.post(
            `/users`,
            {
                encryptionKey: key,
                username: username.value
            },
            { doNotEncryptBody: true }
        );
        if (!getAuthRes.ok) {
            // not sure that this will always work, but try to put error message in
            // most specific place possible, formError being least specific
            if (getAuthRes.err.includes('Username')) {
                usernameError = getAuthRes.err;
            } else if (getAuthRes.err.includes('Password')) {
                passwordError = getAuthRes.err;
            } else {
                formError = getAuthRes.err;
            }
            submitting = false;
            encryptionKey.set('');
            return;
        }

        usernameStore.set(username.value);

        await Auth.populateCookiesAndSettingsAfterAuth(() => (submitting = false));

        await goto('/' + data.redirect);
    }

    function usernameInputKeypress(event: KeyboardEvent) {
        if (event.code === 'Enter') {
            event.stopPropagation();
            event.preventDefault();
            password.focus();
        }
    }

    function passwordInputKeypress(event: KeyboardEvent) {
        if (event.code === 'Enter') {
            event.stopPropagation();
            event.preventDefault();
            void create();
        }
    }

    // user log in / create account form values
    let password: HTMLInputElement;
    let username: HTMLInputElement;
    let usernameError = '';
    let passwordError = '';
    let formError = '';
    let submitting = false;

    // stop the user getting stuck on this page if the redirect after account creation fails
    $: if ($encryptionKey && $usernameStore) {
        void goto('/' + data.redirect);
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
            <div class="px-2 {usernameError ? 'border-destructive border-l-2' : ''}">
                <Textbox
                    label="Username"
                    autocomplete="username"
                    bind:element={username}
                    disabled={submitting}
                    on:keypress={usernameInputKeypress}
                />

                {#if usernameError}
                    <p
                        class="text-warning flex items-center gap-2 py-2 max-w-full"
                        transition:slide={{}}
                    >
                        <AlertCircleOutline size="18px" />
                        {usernameError}
                    </p>
                {/if}
            </div>
            <div class="px-2 {passwordError ? 'border-destructive border-l-2' : ''}">
                <Textbox
                    label="Password"
                    autocomplete="new-password"
                    bind:element={password}
                    disabled={submitting}
                    on:keypress={passwordInputKeypress}
                    type="password"
                />

                {#if passwordError}
                    <p class="text-warning flex items-center gap-2 py-2" transition:slide={{}}>
                        <AlertCircleOutline size="18px" />
                        {passwordError}
                    </p>
                {/if}
            </div>
            <div class="flex items-center justify-between pt-4">
                <a href="/login?redirect={data.redirect}">Log In</a>
                <Button
                    aria-label="Create Account"
                    disabled={submitting}
                    on:click={create}
                    type="button"
                    class="primary flex-center gap-1"
                >
                    <ArrowRightThinCircleOutline size="25" />
                    Create
                </Button>
            </div>
            {#if formError}
                <p class="text-warning flex items-center gap-2 py-2 px-2" transition:slide={{}}>
                    <AlertCircleOutline size="18px" />
                    {formError}
                </p>
            {/if}
        </section>
    </div>
</main>
