<script lang="ts">
    import SubscriptionWidget from '$lib/components/subscription/SubscriptionWidget.svelte';
    import { Button } from '$lib/components/ui/button';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import Skull from 'svelte-material-icons/Skull.svelte';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import PlusThick from 'svelte-material-icons/PlusThick.svelte';
    import LockOutline from 'svelte-material-icons/LockOutline.svelte';
    import Export from 'svelte-material-icons/Export.svelte';
    import Account from 'svelte-material-icons/Account.svelte';
    import GitHubOauthWidget from '$lib/components/GitHubOAuthWidget.svelte';
    import { omit } from '$lib/utils';
    import ChangePasswordDialog from '$lib/components/dialogs/ChangePasswordDialog.svelte';
    import { showPopup } from '$lib/utils/popups';
    import {
        type SettingsKey,
        type SettingConfig,
        type SettingValue,
        Settings as SettingsController
    } from '$lib/controllers/settings/settings';
    import EditSetting from './EditSetting.svelte';
    import { settingsStore } from '$lib/stores';
    import { Auth } from '$lib/controllers/auth/auth';
    import UsageCharts from './UsageCharts.svelte';

    export let data;

    function changePassword() {
        showPopup(ChangePasswordDialog, {});
    }

    function logOut() {
        void Auth.logOut();
    }

    async function exportData() {
        window.open('/api/export/html', '_blank')!.focus();
    }

    const settingsConfigEntries = Object.entries(SettingsController.config) as [
        SettingsKey,
        SettingConfig<SettingValue>
    ][];
</script>

<svelte:head>
    <title>Settings</title>
</svelte:head>

<main class="p-2 md:p-4 md:pl-4 flex-center">
    <div class="w-full md:max-w-4xl">
        <section>
            <div class="flex items-center pb-4">
                <span class="rounded-full w-[35px] h-[35px] bg-accent flex-center">
                    <PlusThick size="25" />
                </span>
                <p class="pl-2 text-lg">Subscription</p>
            </div>
            <div class="pb-4">
                <SubscriptionWidget
                    activeSubscriptionType={data.activeSubscriptionType}
                    prices={data.prices}
                />
            </div>
            <div>
                <UsageCharts usageData={data.usageData} />
            </div>
        </section>
        <section>
            <div class="flex items-center pb-4">
                <span class="rounded-full w-[35px] h-[35px] bg-accent flex-center">
                    <Cog size="25" />
                </span>
                <p class="pl-2 text-lg">Journal Settings</p>
            </div>

            <div class="settings">
                {#each settingsConfigEntries as [key, config] (key)}
                    {#if config.showInSettings}
                        <EditSetting
                            {...omit(config, 'showInSettings')}
                            {...omit($settingsStore[key], 'id')}
                        />
                        <hr />
                    {/if}
                {/each}
            </div>
        </section>
        <section>
            <div class="flex items-center pb-4">
                <span class="rounded-full w-[35px] h-[35px] bg-accent flex-center">
                    <Account size="25" />
                </span>
                <p class="pl-2 text-lg"> My Account </p>
            </div>
            <div class="flex flex-col gap-4">
                <Button
                    class="h-fit flex gap-4 justify-start"
                    variant="outline"
                    aria-label="Log out"
                    on:click={logOut}
                >
                    <div>
                        <Logout size="22" />
                    </div>
                    <div class="text-start">
                        <p> Log Out </p>
                    </div>
                </Button>
                <Button
                    class="h-fit flex gap-4 justify-start"
                    variant="outline"
                    aria-label="export data as HTML"
                    on:click={exportData}
                >
                    <div>
                        <Export size="22" />
                    </div>
                    <div class="text-start">
                        <p> Export Data </p>
                        <p class="text-light"> Generate and open HTML file of entries </p>
                    </div>
                </Button>
            </div>
            <div class="py-8 border-t border-border mt-8">
                <GitHubOauthWidget size={22} />
            </div>
            <div class="pt-8 border-t border-border flex flex-col gap-4">
                <Button
                    class="h-fit flex gap-4 justify-start"
                    variant="destructive"
                    aria-label="Change password"
                    on:click={changePassword}
                >
                    <div>
                        <LockOutline size="22" />
                    </div>
                    <div class="text-start">
                        <p class="text-destructive-foreground font-bold"> Change Password </p>
                        <p class="text-destructive-foreground text-sm">
                            Pick a new password and re-encrypt all data with the new password
                        </p>
                    </div>
                </Button>
                <a aria-label="Delete Account" href="/settings/delete">
                    <Button class="h-fit flex gap-4 w-full justify-start" variant="destructive">
                        <div>
                            <Skull size="22" />
                        </div>
                        <div class="text-start">
                            <p class="text-destructive-foreground font-bold"> Delete Account </p>
                            <p class="text-destructive-foreground text-sm">
                                Delete account, encryption keys and all data on account
                            </p>
                        </div>
                    </Button>
                </a>
            </div>
        </section>
    </div>
</main>

<style lang="scss">
    @import '$lib/styles/layout';

    hr {
        &:last-child {
            display: none;
        }
    }

    section {
        margin-top: 3rem;

        .buttons {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            grid-gap: 0.75rem;

            @media #{$mobile} {
                grid-template-columns: 1fr;
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
