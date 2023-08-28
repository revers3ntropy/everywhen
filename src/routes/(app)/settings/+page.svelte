<script lang="ts">
    import GitHubOauthWidget from '$lib/components/GitHubOAuthWidget.svelte';
    import AccountCircleOutline from 'svelte-material-icons/AccountCircleOutline.svelte';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import LockOutline from 'svelte-material-icons/LockOutline.svelte';
    import Skull from 'svelte-material-icons/Skull.svelte';
    import ChangePasswordDialog from '$lib/components/dialogs/ChangePasswordDialog.svelte';
    import type { SettingConfig, SettingValue } from '$lib/controllers/settings/settings';
    import { showPopup } from '$lib/utils/popups';
    import BackupOptions from '$lib/components/BackupOptions.svelte';
    import {
        type SettingsKey,
        Settings as SettingsController
    } from '$lib/controllers/settings/settings.client';
    import Settings from './Settings.svelte';
    import type { PageData } from './$types';
    import { settingsStore } from '$lib/stores';
    import { Auth } from '$lib/controllers/auth/auth';

    export let data: PageData;

    function changePassword() {
        showPopup(ChangePasswordDialog, {});
    }

    function logOut() {
        void Auth.logOut();
    }

    const settingsConfigEntries = Object.entries(SettingsController.config) as [
        SettingsKey,
        SettingConfig<SettingValue>
    ][];
</script>

<svelte:head>
    <title>Settings</title>
</svelte:head>

<main>
    <section>
        <h1>
            <AccountCircleOutline size="35" />
            <span> My Data and Account </span>
        </h1>

        <div class="buttons">
            <BackupOptions />
        </div>
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

<style lang="less">
    @import '../../../styles/layout';

    h1 {
        .flex-center();
        justify-content: start;
        padding: 1rem 0 2rem 3rem;
        font-size: 24px;

        span {
            margin-left: 0.2em;
        }

        @media @mobile {
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
