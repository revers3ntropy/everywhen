<script lang="ts">
    import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import { encryptionKeyFromPassword } from '../lib/security/authUtils';
    import { api } from '../lib/utils/apiRequest';
    import { displayNotifOnErr } from '../lib/utils/notifications';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData & {
        redirect: string;
    };

    // user log in / create account form values
    let password = '';
    let username = '';

    let actionPending = false;

    async function login(): Promise<void> {
        actionPending = true;
        displayNotifOnErr(
            addNotification,
            await api.get(data, `/auth`, {
                key: encryptionKeyFromPassword(password),
                username
            }),
            {},
            () => (actionPending = false)
        );
        location.assign('/' + data.redirect);
    }

    async function create(): Promise<void> {
        actionPending = true;
        displayNotifOnErr(
            addNotification,
            await api.post(data, `/users`, {
                password: encryptionKeyFromPassword(password),
                username
            }),
            {},
            () => (actionPending = false)
        );
        location.assign('/' + data.redirect);
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
            <button
                aria-label="Create Account"
                disabled={actionPending}
                on:click|preventDefault={create}
                type="button"
            >
                Sign Up
            </button>
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
    @import '../styles/layout';

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
