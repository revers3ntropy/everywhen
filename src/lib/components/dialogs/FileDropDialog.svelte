<script lang="ts">
    import { filedrop, type FileDropOptions, type Files } from 'filedrop-svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import { popup } from '../../constants';
    import { getFileContents, Result } from '../../utils';

    const { addNotification } = getNotificationsContext();

    export const fileOptions: FileDropOptions = {
        fileLimit: 1,
        windowDrop: false,
    };

    export let message: string;
    export let readEncoding = 'utf-8';
    export let withContents: <T>(body: Result<T>) => Promise<void> | void;

    async function onFileDrop (e: CustomEvent<{ files: Files }>) {
        const files = e.detail.files;
        if (files.rejected.length > 0) {
            popup.set(null);
            addNotification({
                removeAfter: 4000,
                text: 'File could not be read, please try again',
                type: 'error',
                position: 'top-center',
            });
            return;
        }
        if (files.accepted.length !== 1) {
            popup.set(null);
            addNotification({
                removeAfter: 4000,
                text: 'Please select exactly one file',
                type: 'error',
                position: 'top-center',
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