<script lang="ts">
    import { goto } from '$app/navigation';
    import ChangePasswordDialog from '$lib/components/dialogs/ChangePasswordDialog.svelte';
    import { showPopup } from '$lib/utils/popups';
    import { onMount } from 'svelte';
    import AccountCircleOutline from 'svelte-material-icons/AccountCircleOutline.svelte';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import Skull from 'svelte-material-icons/Skull.svelte';
    import LockOutline from 'svelte-material-icons/LockOutline.svelte';
    import BackupOptions from '$lib/components/BackupOptions.svelte';
    import { Backup } from '$lib/controllers/backup';
    import { Settings as SettingsController } from '$lib/controllers/settings';
    import { api } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import Settings from './Settings.svelte';

    export let data;

    async function deleteAccount() {
        if (
            !confirm(
                'Are you sure you want to delete your account?' +
                    ' A backup of your data will be downloaded.'
            )
        ) {
            return;
        }

        const { backup: backupData } = displayNotifOnErr(await api.delete(data.auth, '/users'));
        Backup.download(backupData, data.auth.username, true);
        void goto('/');
    }

    function changePassword() {
        showPopup(ChangePasswordDialog, {
            auth: data
        });
    }

    onMount(() => (document.title = 'Settings'));
</script>

<svelte:head>
    <title>Settings</title>
    <meta content="Settings" name="description" />
</svelte:head>

<main>
    <section>
        <h1>
            <AccountCircleOutline size="40" />
            <span>My Data and Account</span>
        </h1>

        <div class="buttons">
            <BackupOptions auth={data.auth} />
        </div>
        <div class="buttons">
            <button aria-label="Change password" on:click={changePassword}>
                <LockOutline size="30" />
                Change Password
            </button>
            <a aria-label="Log Out" class="danger" href="/logout" data-sveltekit-preload-data="tap">
                <Logout size="30" />
                Log Out
            </a>
            <button aria-label="Delete Account" class="danger" on:click={deleteAccount}>
                <Skull size="30" />
                Delete Account and Erase Data
            </button>
        </div>
    </section>
    <section>
        <h1>
            <Cog size="40" />
            <span>General Settings</span>
        </h1>
        <div style="padding: 1rem 0 2rem 0">
            <i> Please note you will have to reload the page for changes to take effect </i>
        </div>

        <div class="settings">
            {#each Object.entries(SettingsController.config) as [key, config] (key)}
                <Settings {...config} {...data.settings[key]} auth={data.auth} />
            {/each}
        </div>
    </section>
</main>

<style lang="less">
    @import '../../../styles/layout';

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

    hr {
        margin: 1.5rem;

        &:last-child {
            display: none;
        }
    }

    section {
        margin-top: 3rem;

        .buttons {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;

            @media @mobile {
                grid-template-columns: 1fr;
            }

            // global for the backup buttons,
            // which are in a child component but should have consistent style
            // with the other buttons
            a,
            :global(button) {
                border-radius: @border-radius;
                padding: 0.8rem;
                margin: 0.5rem;
                display: grid;
                align-items: center;
                justify-content: start;
                text-align: left;
                grid-template-columns: 35px 1fr;
                color: var(--text-color-accent);

                &:hover {
                    text-decoration: none;
                    color: var(--primary);
                    background: var(--v-light-accent);
                }
            }
        }
    }

    .settings {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
        max-width: 1200px;

        @media @mobile {
            gap: 3rem;
        }
    }
</style>