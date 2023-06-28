<script lang="ts">
    import BookSpinner from '$lib/components/BookSpinner.svelte';
    import { notify } from '$lib/components/notifications/notifications';
    import {
        filedrop,
        type FileDropOptions,
        type Files
    } from 'filedrop-svelte';
    import { popup } from '$lib/stores';
    import { getFileContents } from '$lib/utils/files';
    import type { Result } from '$lib/utils/result';

    export const fileOptions: FileDropOptions = {
        fileLimit: 1,
        windowDrop: false
    };

    export let message: string;
    export let readEncoding: 'UTF-8' | 'b64' = 'UTF-8';
    export let showTextBox = false;
    export let textBoxType: 'password' | 'text' = 'text';
    export let textBoxLabel = '';
    export let textBoxPlaceholder = '';
    export let withContents: (
        body: Result<string>,
        textBoxContent?: string
    ) => Promise<void> | void;

    async function onFileDrop(e: CustomEvent<{ files: Files }>) {
        loading = true;

        const files = e.detail.files;
        if (files.rejected.length > 0) {
            popup.set(null);
            notify.error('File could not be read, please try again');
            return;
        }
        if (files.accepted.length !== 1) {
            popup.set(null);
            notify.error('Please select exactly one file');
            return;
        }
        const file = files.accepted[0];
        const contents = await getFileContents(file, readEncoding);

        await withContents(contents, textBoxContent);

        popup.set(null);
    }

    function handleTextBoxInput(e: Event) {
        textBoxContent = (e.target as HTMLInputElement).value;
    }

    let loading = false;
    let textBoxContent = '';
</script>

<div>
    {#if loading}
        <div class="flex-center">
            <BookSpinner />
        </div>
    {:else}
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
    {/if}
</div>
