<script lang="ts">
    import GitHubOauthWidget from '$lib/components/GitHubOAuthWidget.svelte';
    import { notify } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';
    import { download } from '$lib/utils/files.client';
    import AccountCircleOutline from 'svelte-material-icons/AccountCircleOutline.svelte';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import LockOutline from 'svelte-material-icons/LockOutline.svelte';
    import Skull from 'svelte-material-icons/Skull.svelte';
    import ChangePasswordDialog from '$lib/components/dialogs/ChangePasswordDialog.svelte';
    import { showPopup } from '$lib/utils/popups';
    import {
        type SettingsKey,
        type SettingConfig,
        type SettingValue,
        Settings as SettingsController
    } from '$lib/controllers/settings/settings';
    import Settings from './Settings.svelte';
    import { settingsStore } from '$lib/stores';
    import { Auth } from '$lib/controllers/auth/auth';

    function changePassword() {
        showPopup(ChangePasswordDialog, {});
    }

    function logOut() {
        void Auth.logOut();
    }

    async function exportData() {
        const { html } = notify.onErr(await api.get('/export'));
        download('everywhen.html', html);
    }

    const settingsConfigEntries = Object.entries(SettingsController.config) as [
        SettingsKey,
        SettingConfig<SettingValue>
    ][];
</script>

<svelte:head>
    <title>Settings</title>
</svelte:head>

<main class="md:p-4 md:pl-4">
    <section>
        <h1>
            <AccountCircleOutline size="35" />
            <span> My Account </span>
        </h1>
        <div class="buttons">
            <button aria-label="Change password" on:click={changePassword}>
                <LockOutline size="30" />
                Change Password
            </button>
            <button aria-label="Log Out" class="danger" on:click={logOut}>
                <Logout size="30" />
                Log Out
            </button>
            <a aria-label="Delete Account" class="danger" href="/settings/delete">
                <Skull size="30" />
                Delete Account
            </a>
            <button aria-label="Export data" on:click={exportData}>
                <Logout size="30" />
                Export Data
            </button>
        </div>
        <div class="buttons">
            <GitHubOauthWidget />
        </div>
    </section>
    <section>
        <h1>
            <Cog size="35" />
            <span>General Settings</span>
        </h1>

        <div class="settings">
            {#each settingsConfigEntries as [key, config] (key)}
                {#if config.showInSettings}
                    <Settings {...config} {...$settingsStore[key]} />
                {/if}
            {/each}
        </div>
    </section>
</main>

<style lang="scss">
    @import '$lib/styles/layout';

    h1 {
        @extend .flex-center;
        justify-content: flex-start;
        padding: 1rem 0 2rem 3rem;
        font-size: 24px;

        span {
            margin-left: 0.2em;
        }

        @media #{$mobile} {
            font-size: 30px;
            padding: 1rem 0 1rem 1rem;
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

            @media #{$mobile} {
                grid-template-columns: 1fr;
            }

            // global for the backup buttons,
            // which are in a child component but should have consistent style
            // with the other buttons
            a,
            :global(button) {
                border-radius: $border-radius;
                padding: 0.8rem;
                margin: 0.5rem;
                display: grid;
                align-items: center;
                justify-content: flex-start;
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

        @media #{$mobile} {
            gap: 3rem;
        }
    }
</style>
