<script lang="ts">
    import Notebook from "svelte-material-icons/Notebook.svelte";
    import Download from "svelte-material-icons/Download.svelte";
    import Upload from "svelte-material-icons/Upload.svelte";
    import { api } from "$lib/api/apiQuery";
    import { download as downloadFile, showPopup } from "$lib/utils";
    import type { Auth } from "$lib/types";
    import moment from "moment";
    import ImportData from "$lib/components/dialogs/ImportData.svelte";

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
    <section class="buttons">
        <a class="primary" href="/diary">
            <Notebook size="30" />
            Diary
        </a>
    </section>
    <section class="buttons">
        <button on:click={download}>
            <Download size="30" />
            Download Data
        </button>
        <button on:click={upload}>
            <Upload size="30" />
            Import Data
        </button>
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
            border: 1px solid #ccc;
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
</style>
