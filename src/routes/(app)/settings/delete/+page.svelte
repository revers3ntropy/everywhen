<script lang="ts">
    import AccountCircleOutline from 'svelte-material-icons/AccountCircleOutline.svelte';
    import Skull from 'svelte-material-icons/Skull.svelte';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import type { PageData } from './$types';
    import { encryptionKey, username } from '$lib/stores';
    import { Auth } from '$lib/controllers/auth/auth';

    export let data: PageData;

    async function deleteAccount() {
        badUsername = usernameInput.value !== $username;
        badPassword = Auth.encryptionKeyFromPassword(passwordInput.value) !== $encryptionKey;
        if (badUsername || badPassword) return;

        notify.onErr(
            await api.delete(
                '/users',
                { username: $username, encryptionKey: $encryptionKey },
                { doNotTryToDecryptResponse: true }
            )
        );
        await Auth.logOut();
    }

    let badUsername = false;
    let badPassword = false;
    let usernameInput: HTMLInputElement;
    let passwordInput: HTMLInputElement;
</script>

<svelte:head>
    <title>Delete Account</title>
    <meta content="Delete Everywhen account" name="description" />
</svelte:head>

<main class="md:p-4 md:ml-[8.5em]">
    <section>
        <h1>
            <span class="hide-mobile">
                <AccountCircleOutline size="40" />
            </span>
            <span> Delete My Account </span>
        </h1>
        <p>
            All your data will be <b>deleted</b> and you will be <b>logged out</b>.
        </p>

        <form>
            <h3> Please enter your username and password to confirm </h3>

            <div style="margin: 1rem 0">
                Username:
                <input bind:this={usernameInput} type="text" />
                {#if badUsername}
                    <p class="text-warning"> Please enter your username </p>
                {/if}
            </div>

            <div>
                Password:
                <input bind:this={passwordInput} type="password" />
                {#if badPassword}
                    <p class="text-warning"> Please enter your password </p>
                {/if}
            </div>
        </form>

        <button aria-label="Delete Account" class="with-icon primary" on:click={deleteAccount}>
            <Skull size="30" />
            Delete Account and Erase Data
        </button>
    </section>
</main>

<style lang="scss">
    @import '$lib/styles/layout';

    h1 {
        @extend .flex-center;
        margin: 1rem 0 0 0;
        font-size: 38px;

        span {
            margin-left: 0.2em;
        }

        @media #{$mobile} {
            font-size: 30px;
        }
    }

    p {
        margin: 1rem 0;
    }

    form {
        margin: 1rem 0;
    }

    button {
        background: var(--accent-danger);
    }
</style>
