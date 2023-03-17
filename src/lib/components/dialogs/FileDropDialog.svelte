<script lang="ts">
    import { filedrop, type FileDropOptions, type Files } from 'filedrop-svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import { popup } from '../../stores';
    import { getFileContents } from '../../utils/files';
    import { ERR_NOTIFICATION } from '../../utils/notifications';
    import type { Result } from '../../utils/result';

    const { addNotification } = getNotificationsContext();

    export const fileOptions: FileDropOptions = {
        fileLimit: 1,
        windowDrop: false,
    };

    export let message: string;
    export let readEncoding: 'UTF-8' | 'b64' = 'UTF-8';
    export let withContents: (body: Result<string>) => Promise<void> | void;

    async function onFileDrop (e: CustomEvent<{ files: Files }>) {
        const files = e.detail.files;
        if (files.rejected.length > 0) {
            popup.set(null);
            addNotification({
                ...ERR_NOTIFICATION,
                text: 'File could not be read, please try again',
            });
            return;
        }
        if (files.accepted.length !== 1) {
            popup.set(null);
            addNotification({
                ...ERR_NOTIFICATION,
                text: 'Please select exactly one file',
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
    class="dropzone"
    on:filedrop={onFileDrop}
    use:filedrop={fileOptions}
>
    {message}
</div>