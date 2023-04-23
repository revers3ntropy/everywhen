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
    export let showTextBox = false;
    export let textBoxType: 'password' | 'text' = 'text';
    export let textBoxLabel = '';
    export let textBoxPlaceholder = '';
    export let withContents: (
        body: Result<string>,
        textBoxContent?: string,
    ) => Promise<void> | void;

    let textBoxContent = '';

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

        await withContents(contents, textBoxContent);

        popup.set(null);
    }

    function handleTextBoxInput (e: Event) {
        textBoxContent = (e.target as HTMLInputElement).value;
    }
</script>

<div>
    <div class="flex-center">
        {#if showTextBox}
            <label>
                {textBoxLabel}
                <input
                    class="text-box"
                    on:input={handleTextBoxInput}
                    placeholder={textBoxPlaceholder}
                    type={textBoxType}
                />
            </label>
        {/if}
    </div>

    <div
        class="dropzone"
        on:filedrop={onFileDrop}
        use:filedrop={fileOptions}
    >
        {message}
    </div>
</div>
