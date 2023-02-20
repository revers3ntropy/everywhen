<script lang="ts">
    import moment from "moment";
    import Notebook from "svelte-material-icons/Notebook.svelte";
    import Download from "svelte-material-icons/Download.svelte";
    import Upload from "svelte-material-icons/Upload.svelte";
    import ChartTimeline from "svelte-material-icons/ChartTimeline.svelte";
    import Logout from "svelte-material-icons/Logout.svelte";
    import ImportData from "../../lib/components/dialogs/ImportData.svelte";
    import LabelOutline from "svelte-material-icons/LabelOutline.svelte";
    import { api } from "../../lib/api/apiQuery";
    import { download as downloadFile, showPopup } from "../../lib/utils";
    import type { Auth } from "../../lib/types";

    export let data: Auth;

    async function download () {
        const { data: backupData } = await api.get(data, "/backups");
        const dateFmt = moment(new Date()).format("D-MM-YYYY");
        downloadFile(`${ dateFmt }.backup.json`, backupData);
    }

    function upload () {
        showPopup(ImportData, { auth: data }, () => {
            window.location.reload();
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

    .buttons {
        display: flex;

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
                display: none
            }

            &:hover {
                background: @light-accent;
                color: @accent-color-secondary;
                text-decoration: none;

            }
        }
    }

    h1 {
        font-size: 1.5rem;
        margin: 1em;
        padding: 0.5em;
        border-bottom: 1px solid @light-accent;
        text-align: start;
    }
</style>
