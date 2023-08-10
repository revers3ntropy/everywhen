<script lang="ts">
    import { BackupControllerClient } from '$lib/controllers/backup/backup';
    import AccountCircleOutline from 'svelte-material-icons/AccountCircleOutline.svelte';
    import Skull from 'svelte-material-icons/Skull.svelte';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import type { PageData } from './$types';
    import { username } from '$lib/stores';
    import { Auth } from '$lib/controllers/auth/auth';

    export let data: PageData;

    async function deleteAccount() {
        if (usernameInput.value !== $username) {
            badUsername = true;
            return;
        }

        const { backup: backupData } = notify.onErr(await api.delete('/users'));
        BackupControllerClient.download(backupData, $username, true);
        await Auth.logOut(false);
    }

    let badUsername = false;
    let usernameInput: HTMLInputElement;
</script>

<svelte:head>
    <title>Delete Account</title>
    <meta content="Delete halcyon.Land account" name="description" />
</svelte:head>

<main>
    <section>
        <h1>
            <span class="hide-mobile">
                <AccountCircleOutline size="40" />
            </span>
            <span> Delete My Account </span>
        </h1>
        <p>
            All your data will be <b>deleted</b> and you will be <b>logged out</b>. <br />
            A <b>backup</b> of your data will be <b>downloaded</b>.
        </p>

        <form>
            Please type your <b>username</b> to confirm:
            <input bind:this={usernameInput} type="text" />
            {#if badUsername}
                <p class="text-warning"> Please enter your username </p>
            {/if}
        </form>

        <button aria-label="Delete Account" class="with-icon primary" on:click={deleteAccount}>
            <Skull size="30" />
            Delete Account and Erase Data
        </button>
    </section>
</main>

<style lang="less">
    @import '../../../../styles/layout';

    h1 {
        .flex-center();
        margin: 1rem 0 0 0;
        font-size: 38px;

        span {
            margin-left: 0.2em;
        }

        @media @mobile {
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
