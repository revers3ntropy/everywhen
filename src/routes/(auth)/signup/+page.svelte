<script lang="ts">
    import { goto } from '$app/navigation';
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

<main class="flex-center">
    <form class="content">
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
            <button
                aria-label="Create Account"
                disabled={actionPending}
                on:click|preventDefault={create}
                type="button"
                class="primary flex-center gap-1"
            >
                Create Account
                <ArrowRightThinCircleOutline size="25" />
            </button>
        </div>
    </form>
</main>

<style lang="scss">
    @import '$lib/styles/layout';
    @import '$lib/styles/text';

    main {
        @extend .flex-center;
        height: 100vh;
    }

    .content {
        max-width: 90vw;

        button {
            margin: 0;
        }
    }

    input {
        width: 300px;
        font-size: 1.3rem;
        margin-top: 0.1rem;
    }

    label {
        display: flex;
        flex-direction: column;
        margin: 3rem 0;

        & > span {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 0.3rem;
        }

        i {
            @extend .text-light;
            display: flex;
            flex-direction: row;
            gap: 0.3rem;
            align-items: center;
            font-size: 0.98rem;

            :global(svg) {
                height: 100%;
            }
        }
    }
</style>
