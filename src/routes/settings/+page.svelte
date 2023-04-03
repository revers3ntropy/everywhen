<script lang="ts">
    import BackupOptions from '../../lib/components/BackupOptions.svelte';
    import { onMount } from 'svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import Skull from 'svelte-material-icons/Skull.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import { Backup } from '../../lib/controllers/backup';
    import { Settings as SettingsController } from '../../lib/controllers/settings';
    import { api } from '../../lib/utils/apiRequest';
    import { displayNotifOnErr } from '../../lib/utils/notifications';
    import Settings from './Settings.svelte';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData;

    async function deleteAccount () {
        if (!confirm(
            'Are you sure you want to delete your account?'
            + ' A backup of your data will be downloaded.',
        )) {
            return;
        }
        const { backup: backupData } = displayNotifOnErr(addNotification,
            await api.delete(data, '/users'),
        );
        Backup.download(backupData, data.username);
        location.assign('/');
    }

    onMount(() => document.title = 'Settings');

</script>

<svelte:head>
    <title>Settings</title>
    <meta content="Settings" name="description" />
</svelte:head>

<main>
    <section>
        <h1>My Data and Account</h1>

        <div class="buttons">
            <BackupOptions auth={data} />
            <a
                aria-label="Log Out"
                href="/logout"
            >
                <Logout size="30" />
                Log Out
            </a>
            <button
                aria-label="Delete Account"
                class="danger"
                on:click={deleteAccount}
            >
                <Skull size="30" />
                Delete Account and Erase Data
            </button>
        </div>
    </section>
    <section>
        <i>Please note you will have to reload the page for changes to take effect</i>
        <h1>General Settings</h1>
        {#each Object.entries(SettingsController.config) as [key, config] (key)}
            <Settings
                {...config}
                {...data.settings[key]}
                auth={data}
            />
        {/each}
    </section>
</main>

<style lang="less">
    @import '../../styles/layout.less';

    hr {
        margin: 1.5rem;

        &:last-child {
            display: none;
        }
    }

    section {
        margin-top: 3rem;

        .buttons {
            display: flex;
            flex-wrap: wrap;

            // global for the backup buttons,
            // which are in a child component but should have consistent style
            // with the other buttons
            a, :global(button) {
                .bordered();
                border-radius: 10px;
                padding: .8rem;
                margin: .5rem;
                display: grid;
                place-items: center;
                grid-template-columns: 35px 1fr;
                color: @accent-color-primary;

                &.danger:hover {
                    color: @accent-color-danger;
                }

                &:hover {
                    text-decoration: none;
                    color: @accent-color-secondary;
                    background: @light-v-accent;
                }
            }
        }
    }

</style>