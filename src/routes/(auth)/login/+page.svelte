<script lang="ts">
    import { slide } from 'svelte/transition';
    import AlertCircleOutline from 'svelte-material-icons/AlertCircleOutline.svelte';
    import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
    import type { PageData } from './$types';
    import { goto } from '$app/navigation';
    import { encryptionKey, username as usernameStore } from '$lib/stores';
    import { Button } from '$lib/components/ui/button';
    import { Checkbox } from '$lib/components/ui/checkbox';
    import { Label } from '$lib/components/ui/label';
    import Logo from '$lib/components/ui/Logo.svelte';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { Auth } from '$lib/controllers/auth/auth';
    import { api } from '$lib/utils/apiRequest';

    export let data: PageData;

    function resetErrors() {
        usernameError = '';
        passwordError = '';
        formError = '';
    }

    async function submit(): Promise<void> {
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

        // set before making the request so the request is made as if we are logged in
        $encryptionKey = key;

        const getAuthRes = await api.get(
            '/auth',
            {
                key,
                username: username.value,
                rememberMe: rememberMe
            },
            { doNotEncryptBody: true, doNotLogoutOn401: true }
        );
        if (!getAuthRes.ok) {
            formError = getAuthRes.err;
            submitting = false;
            $encryptionKey = '';
            return;
        }

        $usernameStore = username.value;
        await Auth.populateCookiesAndSettingsAfterAuth(() => (submitting = false));

        await goto('/' + data.redirect);
    }

    function usernameInputKeypress(event: KeyboardEvent) {
        if (event.code === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            if (password.value) {
                void submit();
                return;
            }
            password.focus();
        }
    }

    function passwordInputKeypress(event: KeyboardEvent) {
        if (event.code === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            void submit();
        }
    }

    // user log in / create account form values
    let password: HTMLInputElement;
    let username: HTMLInputElement;
    let rememberMe = false;
    let usernameError = '';
    let passwordError = '';
    let formError = '';
    let submitting = false;

    // stop the user getting stuck on this page if the redirect after login fails
    $: if ($encryptionKey && $usernameStore) {
        void goto('/' + data.redirect);
    }
</script>

<svelte:head>
    <title>Log In</title>
    <meta content="Log in to Everywhen" name="description" />
</svelte:head>

<main class="flex-center h-screen">
    <div class="px-2">
        <section class="pl-4 md:pl-0 pb-3 md:pb-4 md:flex md:justify-center">
            <p class="text-left title-font text-3xl pb-2 flex items-center gap-2 w-fit">
                <Logo scale={0.1} /> Everywhen
            </p>
        </section>
        <form class="md:border border-border rounded-xl p-4 md:py-6 md:bg-vLightAccent">
            <p class="text-left text-md pb-2 pl-2">Login to continue</p>
            <div class="px-2 {usernameError ? 'border-destructive border-l-2' : ''}">
                <Textbox
                    autocomplete="username"
                    label="Username"
                    autofocus
                    on:keypress={usernameInputKeypress}
                    id="username"
                    bind:element={username}
                    disabled={submitting}
                />

                {#if usernameError}
                    <p class="text-warning flex items-center gap-2 py-2" transition:slide={{}}>
                        <AlertCircleOutline size="18px" />
                        {usernameError}
                    </p>
                {/if}
            </div>
            <div class="px-2 {passwordError ? 'border-destructive border-l-2' : ''}">
                <Textbox
                    autocomplete="current-password"
                    label="Password"
                    type="password"
                    on:keypress={passwordInputKeypress}
                    id="password"
                    bind:element={password}
                    disabled={submitting}
                />

                {#if passwordError}
                    <p class="text-warning flex items-center gap-2 py-2" transition:slide={{}}>
                        <AlertCircleOutline size="18px" />
                        {passwordError}
                    </p>
                {/if}
            </div>
            <div class="py-4 px-2 flex items-center gap-2">
                <Checkbox id="terms" bind:checked={rememberMe} />
                <Label for="terms">Remember me</Label>
            </div>
            <div class="flex items-center justify-between px-2">
                <a
                    aria-label="Create Account"
                    href="/signup/?redirect={encodeURIComponent(data.redirect)}"
                >
                    Sign Up
                </a>
                <Button
                    aria-label="Log In"
                    class="primary flex-center gap-1"
                    disabled={submitting}
                    on:click={submit}
                    type="button"
                >
                    <ChevronRight size="30" />
                    Log In
                </Button>
            </div>
            {#if formError}
                <p class="text-warning flex items-center gap-2 py-2 px-2" transition:slide={{}}>
                    <AlertCircleOutline size="18px" />
                    {formError}
                </p>
            {/if}
        </form>
    </div>
</main>
