<script lang="ts">
    import moment from 'moment';
    import { onMount } from 'svelte';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import Download from 'svelte-material-icons/Download.svelte';
    import LabelOutline from 'svelte-material-icons/LabelOutline.svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import Notebook from 'svelte-material-icons/Notebook.svelte';
    import Skull from 'svelte-material-icons/Skull.svelte';
    import Upload from 'svelte-material-icons/Upload.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { App } from '../../app';
    import FileDropDialog from '../../lib/components/dialogs/FileDropDialog.svelte';
    import EntryTitles from '../../lib/components/EntryTitles.svelte';
    import type { Entry } from '../../lib/controllers/entry';
    import { encryptionKeyFromPassword } from '../../lib/security/authUtils';
    import { obfuscated } from '../../lib/stores.js';
    import { api } from '../../lib/utils/apiRequest';
    import { download as downloadFile } from '../../lib/utils/files';
    import { displayNotifOnErr, SUCCESS_NOTIFICATION } from '../../lib/utils/notifications';
    import { showPopup } from '../../lib/utils/popups';
    import type { Result } from '../../lib/utils/result';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData & {
        titles: Record<number, Entry[]>,
    };

    function downloadBackup (data: string, username: string) {
        const dateFmt = moment(new Date()).format('D-MM-YYYY');
        downloadFile(`${dateFmt}-${username}.backup.encrypted.json`, data);
    }

    async function download () {
        const { data: backupData } = displayNotifOnErr(addNotification,
            await api.get(data, '/backups'),
        );
        downloadBackup(backupData, data.username);
    }

    function upload () {
        showPopup(FileDropDialog, {
            auth: data,
            message: 'Drop encrypted .json file here',
            showTextBox: true,
            textBoxType: 'password',
            textBoxLabel: 'Password of account the backup came from ' +
                '(leave blank if same account)',
            withContents: async (res: Result<string>, password?: string) => {
                const contents = displayNotifOnErr(addNotification, res);

                if (!confirm(
                    'Are you sure you want to restore from this backup?'
                    + ' This will overwrite all your existing data.',
                )) {
                    return;
                }

                if (!password) {
                    password = data.key;
                } else {
                    password = encryptionKeyFromPassword(password);
                }

                displayNotifOnErr(addNotification,
                    await api.post(data, '/backups', {
                        data: contents,
                        key: password,
                    }),
                );

                addNotification({
                    ...SUCCESS_NOTIFICATION,
                    text: 'File uploaded successfully',
                });
            },
        });
    }

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
        downloadBackup(backupData, data.username);
        location.assign('/');
    }

    onMount(() => document.title = `Home`);
</script>

<main>
    <section>
        <div class="buttons">
            <a class="primary" href="/diary">
                <Notebook size="30" />
                Diary
            </a>
            <a class="primary" href="/events">
                <Calendar size="30" />
                Events
            </a>
            <a class="primary" href="/labels">
                <LabelOutline size="30" />
                Labels
            </a>
            <a class="primary" href="/timeline">
                <ChartTimeline size="30" />
                Timeline
            </a>
            <a class="primary" href="/stats">
                <Counter size="30" />
                Stats
            </a>
            <a class="primary" href="/settings">
                <Cog size="30" />
                Settings
            </a>
        </div>
    </section>
    <section>
        <h1>My Data</h1>

        <div class="buttons">
            <button on:click={download}>
                <Download size="30" />
                Download Backup
            </button>
            <button on:click={upload}>
                <Upload size="30" />
                Restore from Backup
            </button>
        </div>
    </section>
    <section>
        <h1>My Account</h1>

        <div class="buttons">
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
    {#if Object.keys(data.titles || {}).length}
        <section>
            <h1>Recent Entries</h1>
            <EntryTitles
                titles={data.titles}
                obfuscated={$obfuscated}
            />
        </section>
    {/if}
</main>

<style lang="less">
    @import '../../styles/variables.less';
    @import '../../styles/layout.less';

    .buttons {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        @media @mobile {
            flex-direction: column;
        }

        a, button {
            display: grid;
            align-items: center;
            justify-content: space-between;
            // assumed one svg icon and then text
            grid-template-columns: 35px 1fr;
            font-size: 1.2rem;
            padding: .7em 1.2em;
            margin: 1em;
            border-radius: 5px;
            text-decoration: none;
            transition: all 0.2s ease;
            color: @accent-color-primary;

            &:after {
                display: none;
            }

            &:hover {
                background: @light-accent;
                color: @accent-color-secondary;
                text-decoration: none;

                :global(svg), :global(svg *) {
                    color: @accent-color-secondary !important;
                }
            }

            @media @mobile {
                .bordered();

                padding: 0.5em;
                margin: 0.2em;
                text-align: center;
            }
        }
    }

    h1 {
        font-size: 1.5rem;
        margin: 1em;
        padding: 0.5em;
        border-bottom: 1px solid @light-accent;
        text-align: start;

        @media @mobile {
            font-size: 1.2rem;
        }
    }
</style>
