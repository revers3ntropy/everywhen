<script lang="ts">
    import moment from 'moment';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import Download from 'svelte-material-icons/Download.svelte';
    import LabelOutline from 'svelte-material-icons/LabelOutline.svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import Notebook from 'svelte-material-icons/Notebook.svelte';
    import Upload from 'svelte-material-icons/Upload.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { App } from '../../app';
    import { api } from '../../lib/api/apiQuery';
    import FileDropDialog from '../../lib/components/dialogs/FileDropDialog.svelte';
    import { displayNotifOnErr, download as downloadFile, Result, showPopup } from '../../lib/utils';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData;

    async function download () {
        const { data: backupData } = displayNotifOnErr(addNotification,
            await api.get(data, '/backups'),
        );
        const dateFmt = moment(new Date()).format('D-MM-YYYY');
        downloadFile(`${dateFmt}.backup.json`, backupData);
    }

    function upload () {
        showPopup(FileDropDialog, {
            auth: data,
            message: 'Drop encrypted .json file here',
            withContents: async (res: Result<string>) => {
                const contents = displayNotifOnErr(addNotification, res);

                displayNotifOnErr(addNotification,
                    await api.post(data, '/backups', {
                        data: contents,
                    }),
                );

                addNotification({
                    removeAfter: 4_000,
                    text: 'File uploaded successfully',
                    type: 'success',
                    position: 'top-center',
                });
            },
        });
    }
</script>

<main>
    <section>
        <div class="buttons">
            <a class="primary" href="/diary">
                <Notebook size="30" />
                Diary
            </a>
            <a class="primary" href="/labels">
                <LabelOutline size="30" />
                Labels
            </a>
            <a class="primary" href="/labels">
                <ChartTimeline size="30" />
                Timeline
            </a>
        </div>
    </section>
    <section>
        <h1>My Data</h1>

        <div class="buttons">
            <button on:click={download}>
                <Download size="30" />
                Download Data
            </button>
            <button on:click={upload}>
                <Upload size="30" />
                Import Data
            </button>
        </div>
    </section>
    <section>
        <h1>My Account</h1>

        <div class="buttons">
            <a href="/logout">
                <Logout size="30" />
                Log Out
            </a>
        </div>
    </section>
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
