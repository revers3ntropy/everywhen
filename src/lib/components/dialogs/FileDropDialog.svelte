<script lang="ts">
    import { popup } from "../../constants";
    import { getNotificationsContext } from "svelte-notifications";
    import { getFileContents } from "../../utils";
    import { type FileDropOptions, type Files, filedrop } from "filedrop-svelte";
    import { Result } from "postcss";

    const { addNotification } = getNotificationsContext();

    export const fileOptions: FileDropOptions = {
        fileLimit: 1,
        windowDrop: false
    };

    export let message: string;
    export let readEncoding = "utf-8";
    export let withContents: <T>(body: Result<T, string>) => Promise<void> | void;

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
        const contents = await getFileContents(file, readEncoding);

        await withContents(contents);

        popup.set(null);
    }
</script>

<div
    use:filedrop={fileOptions}
    on:filedrop={onFileDrop}
    class="dropzone"
>
    {message}
</div>