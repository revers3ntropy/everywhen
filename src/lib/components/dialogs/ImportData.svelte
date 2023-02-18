<script lang="ts">
    import FileDrop from "filedrop-svelte";
    import type { Files } from "filedrop-svelte";
    import { popup } from "../../constants";
    import { getNotificationsContext } from "svelte-notifications";
    import { getFileContents } from "../../utils";
    import { api } from "../../api/apiQuery";
    import type { Auth } from "../../types";

    const { addNotification } = getNotificationsContext();

    export let auth: Auth;

    async function onFileDrop (e: CustomEvent<{ files: Files }>) {
        const files = e.detail.files;
        if (files.rejected.length > 0) {
            popup.set(null);
            addNotification({
                removeAfter: 4000,
                text: "File could not be read, please try again",
                type: "error",
                position: "top-center"
            });
            return;
        }
        if (files.accepted.length !== 1) {
            popup.set(null);
            addNotification({
                removeAfter: 4000,
                text: "Please select exactly one file",
                type: "error",
                position: "top-center"
            });
            return;
        }
        const file = files.accepted[0];
        const contents = await getFileContents(file);
        const res = await api.post(auth, "/backups", {
            data: contents
        });

        if (res.erroneous) {
            addNotification({
                removeAfter: 4000,
                text: "Error uploading file: " + res.body.message,
                type: "error",
                position: "top-center"
            });
        }
        popup.set(null);
    }
</script>

<div>
    <FileDrop on:filedrop={onFileDrop}>
        Upload files
    </FileDrop>
</div>