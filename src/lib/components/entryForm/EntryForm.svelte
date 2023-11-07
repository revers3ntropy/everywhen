<script lang="ts">
    import { tooltip } from '@svelte-plugins/tooltips';
    import FormatListBulleted from 'svelte-material-icons/FormatListBulleted.svelte';
    import TextBoxEditOutline from 'svelte-material-icons/TextBoxEditOutline.svelte';
    import Tick from 'svelte-material-icons/Check.svelte';
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import InsertImage from '$lib/components/asset/InsertImage.svelte';
    import { Asset } from '$lib/controllers/asset/asset';
    import type { SettingsKey } from '$lib/controllers/settings/settings';
    import { dispatch, listen } from '$lib/dataChangeEvents';
    import { Result } from '$lib/utils/result';
    import { serializedAgentData } from '$lib/utils/userAgent';
    import LabelSelect from '$lib/components/label/LabelSelect.svelte';
    import { LS_KEYS } from '$lib/constants';
    import type { Entry } from '$lib/controllers/entry/entry';
    import type { Label } from '$lib/controllers/label/label';
    import {
        currentlyUploadingAssets,
        currentlyUploadingEntries,
        enabledLocation, encryptionKey,
        settingsStore, username
    } from '$lib/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { getLocation } from '$lib/utils/geolocation';
    import { clientLogger } from '$lib/utils/log';
    import { notify } from '$lib/components/notifications/notifications';
    import { wordCount } from '$lib/utils/text';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import FormatOptions from './FormatOptions.svelte';
    import LocationToggle from '../location/LocationToggle.svelte';
    import { paste } from './paste';
    import {decrypt, encrypt} from "$lib/utils/encryption";

    // as this form is used in entry editing and creating
    export let action: 'create' | 'edit' = 'create';

    export let entry = null as Entry | null;
    if (entry && action !== 'edit') {
        throw new Error('entry can only be set when action is edit');
    }
    if (!entry && action === 'edit') {
        throw new Error('entry must be set when action is edit');
    }

    export let newEntryTitle = '';
    export let newEntryBody = '';
    export let newEntryLabel = '';

    export let obfuscated = true;

    function resetEntryForm() {
        newEntryTitle = '';
        newEntryBody = '';
        newEntryLabel = '';
    }

    function titleLsKey() {
        return `${LS_KEYS.newEntryTitle}-${$username}-${entry?.id ?? ''}`;
    }
    function bodyLsKey() {
        return `${LS_KEYS.newEntryBody}-${$username}-${entry?.id ?? ''}`;
    }
    function labelLsKey() {
        return `${LS_KEYS.newEntryLabel}-${$username}-${entry?.id ?? ''}`;
    }

    // TODO: encrypt entry data in LS and namespace key to user,
    //       and then don't clear on logout
    function saveToLS() {
        localStorage.setItem(titleLsKey(), encrypt(newEntryTitle, $encryptionKey));
        localStorage.setItem(bodyLsKey(), encrypt(newEntryBody, $encryptionKey));
        localStorage.setItem(labelLsKey(), newEntryLabel);
    }

    function restoreFromLS() {
        if (!browser) return;
        // if nothing is saved, don't restore.
        // particularly important for editing entries
        if (localStorage.getItem(bodyLsKey()) === null) return;
        newEntryTitle = decrypt(localStorage.getItem(titleLsKey()) || '', $encryptionKey).mapErr(() => {
            notify.error('Failed to decrypt saved entry title');
            return '';
        }).merge();
        newEntryBody =decrypt( localStorage.getItem(bodyLsKey()) || '', $encryptionKey).mapErr(() => {
            notify.error('Failed to decrypt saved entry');
            return '';
        }).merge();
        newEntryLabel = localStorage.getItem(labelLsKey()) || '';
    }

    function areUnsavedChanges() {
        if (!entry) return false;

        // check for unsaved changes
        return (
            entry.title !== newEntryTitle ||
            entry.body !== newEntryBody ||
            (entry.label?.id || '') !== newEntryLabel
        );
    }

    /**
     * @src https://stackoverflow.com/questions/11076975
     */
    function insertAtCursor(input: HTMLInputElement | HTMLTextAreaElement, text: string) {
        if (input.selectionStart || input.selectionStart === 0) {
            const startPos = input.selectionStart ?? undefined;
            const endPos = input.selectionEnd ?? 0;
            input.value =
                input.value.substring(0, startPos) +
                text +
                input.value.substring(endPos, input.value.length);
            // restore cursor to after inserted text
            input.selectionStart = startPos + text.length;
            input.selectionEnd = startPos + text.length;
        } else {
            input.value += text;
        }

        newEntryBody = input.value;
    }

    function wrapSelectedWith(
        input: HTMLInputElement | HTMLTextAreaElement,
        before: string,
        after: string,
        insertSpaceIfEmpty = true
    ) {
        const selected = input.value.substring(input.selectionStart ?? 0, input.selectionEnd ?? 0);
        if (selected.length === 0 && insertSpaceIfEmpty) {
            insertAtCursor(input, `${before} ${after}`);
            return;
        }
        insertAtCursor(input, before + selected + after);
    }

    function makeWrapper(before: string, after: string, insertSpaceIfEmpty = true): () => void {
        return () => {
            if (newEntryInputElement) {
                wrapSelectedWith(newEntryInputElement, before, after, insertSpaceIfEmpty);
            }
        };
    }

    interface EntryPostPayload {
        created: number;
        latitude: number | null;
        longitude: number | null;
        title: string;
        body: string;
        labelId: string | null;
        agentData: string;
        wordCount: number;
    }

    async function onEntryCreation(body: EntryPostPayload) {
        const { id } = notify.onErr(await api.post('/entries', { ...body }));
        submitted = false;
        if (id) {
            // make really sure it's saved before resetting
            resetEntryForm();
            saveToLS();
        } else {
            clientLogger.error('failed to make entry', { id, body });
            notify.error(`Failed to create entry`);
            return;
        }

        let label: null | Label = null;
        if (body.labelId) {
            label = labels?.find(l => l.id === body.labelId) ?? null;
            if (!label) {
                clientLogger.error('label not found');
            }
        }

        await dispatch.create('entry', {
            entry: {
                id,
                title: body.title,
                body: body.body,
                created: body.created,
                createdTzOffset: currentTzOffset(),
                pinned: null,
                deleted: null,
                latitude: body.latitude,
                longitude: body.longitude,
                agentData: body.agentData,
                wordCount: body.wordCount,
                label,
                edits: []
            },
            isBullet: useBulletEntryForm
        });
    }

    async function onEntryEdit(body: EntryPostPayload) {
        if (!entry) {
            clientLogger.error('entry must be set when action is edit');
            return;
        }
        if (!areUnsavedChanges()) {
            if (!confirm('No changes have been made, are you sure you want to edit this entry?')) {
                return;
            }
        }
        notify.onErr(
            await api.put(
                apiPath('/entries/?', entry.id),
                body as unknown as Record<string, unknown>
            )
        );
        await goto(`/journal/${entry.id}`);
    }

    async function submit() {
        if (useBulletEntryForm && !newEntryBody) {
            notify.error(`Bullets cannot be empty`);
            return;
        }

        currentlyUploadingEntries.update(v => v + 1);

        submitted = true;

        const currentLocation = $enabledLocation ? await getLocation() : [null, null];

        const body = {
            title: newEntryTitle,
            body: newEntryBody,
            labelId: newEntryLabel,
            latitude: currentLocation[0],
            longitude: currentLocation[1],
            created: nowUtc(),
            agentData: serializedAgentData(),
            createdTzOffset: currentTzOffset(),
            wordCount: wordCount(newEntryBody)
        };

        switch (action) {
            case 'create':
                await onEntryCreation(body);
                break;
            case 'edit':
                await onEntryEdit(body);
                break;
            default:
                throw new Error(`Unknown action: ${action as string}`);
        }

        if (useBulletEntryForm) {
            newEntryInputElement.focus();
        }

        currentlyUploadingEntries.update(v => v - 1);
    }

    function onNewImage(md: string) {
        insertAtCursor(newEntryInputElement, `\n${md}\n`);
    }

    async function loadLabels() {
        labels = notify.onErr(await api.get('/labels')).labels;
    }

    function resizeTextAreaToFitContent() {
        textAreaSizeTester.value = newEntryBody;
        textAreaSizeTester.style.height = '0px';
        textAreaSizeTester.style.width = `${newEntryInputElement.clientWidth}px`;
        const minBodyTextareaHeight = useBulletEntryForm ? 0 : 100;
        const heightPx = Math.max(textAreaSizeTester.scrollHeight, minBodyTextareaHeight);
        newEntryInputElement.style.height = `${heightPx}px`;
    }

    function handleEntryInputKeydown(event: KeyboardEvent) {
        switch (event.key) {
            case 'Tab': {
                event.preventDefault();
                insertAtCursor(newEntryInputElement, '\t');
                break;
            }
            case 'Enter': {
                if (event.shiftKey) {
                    event.preventDefault();
                    insertAtCursor(newEntryInputElement, '\n');
                } else if (event.ctrlKey || useBulletEntryForm) {
                    event.preventDefault();
                    void submit();
                }
                break;
            }
        }
    }

    function pasteText(text: string) {
        insertAtCursor(newEntryInputElement, text);
    }

    async function pasteFiles(files: File[] | FileList) {
        const [uploadedImages, errors] = Result.filter(await Asset.uploadImages(files));

        notify.error(errors);

        for (const { publicId, fileName } of uploadedImages) {
            onNewImage(Asset.generateMarkdownLink(fileName, publicId));
        }
    }

    async function switchEntryFormMode() {
        const mode = !useBulletEntryForm;
        $settingsStore.useBulletEntryForm.value = mode;
        useBulletEntryForm = mode;
        resizeTextAreaToFitContent();
        await api.put('/settings', {
            key: 'useBulletEntryForm' as SettingsKey,
            value: mode
        });
    }

    onMount(() => {
        void loadLabels();

        // TODO: entry edit without saved should default to entry
        restoreFromLS();

        if (!newEntryBody && !newEntryTitle) {
            obfuscated = false;
        }

        resizeTextAreaToFitContent();

        mounted = true;
    });

    let useBulletEntryForm = $settingsStore.useBulletEntryForm.value;
    let mounted = false;

    let textAreaSizeTester: HTMLTextAreaElement;
    let newEntryInputElement: HTMLTextAreaElement;
    let labels: Label[];

    listen.label.onCreate(label => {
        labels = [...labels, label];
    });
    listen.label.onUpdate(label => {
        labels = labels.map(l => (l.id === label.id ? label : l));
    });
    listen.label.onDelete(id => {
        labels = labels.filter(l => l.id !== id);
    });

    let submitted = false;

    $: if (mounted && browser && [newEntryTitle, newEntryBody, newEntryLabel]) {
        saveToLS();
    }
    $: if (browser && newEntryInputElement) {
        newEntryBody;
        setTimeout(resizeTextAreaToFitContent, 0);
    }
</script>

<div class="mt-4 mx-1 md:mx-4">
    {#key useBulletEntryForm}
        <div class="head">
            <div class="left-options">
                <button
                    aria-label="Switch to bullet journaling"
                    class="with-circled-icon"
                    on:click={switchEntryFormMode}
                    use:tooltip={{
                        content: `Switch to ${
                            useBulletEntryForm ? 'standard' : 'bullet'
                        } journaling`,
                        position: 'right'
                    }}
                >
                    {#if useBulletEntryForm}
                        <TextBoxEditOutline size="30" />
                    {:else}
                        <FormatListBulleted size="30" />
                    {/if}
                </button>

                <div class="flex-center h-full">
                    <LocationToggle size={23} />
                </div>
                <div class="flex-center h-full">
                    <FormatOptions {makeWrapper} />
                </div>
                <div class="flex-center h-full">
                    <InsertImage onInput={onNewImage} />
                </div>

                {#if $currentlyUploadingAssets > 0}
                    <div style="margin: 0 0 0 4px;">
                        <i class="text-light">
                            Uploading {$currentlyUploadingAssets} images...
                        </i>
                    </div>
                {/if}
            </div>
            <div class="flex justify-end items-center {obfuscated ? 'blur' : ''}">
                <LabelSelect bind:value={newEntryLabel} {labels} fromRight />
            </div>
        </div>
        {#if !useBulletEntryForm}
            <div class="entry-title-container">
                <input
                    aria-label="Entry Title"
                    bind:value={newEntryTitle}
                    class="title text-lg"
                    class:obfuscated
                    placeholder={obfuscated ? '' : 'Title (optional)'}
                    disabled={obfuscated || submitted}
                />
            </div>
        {/if}
        <div class="entry-container">
            <textarea
                bind:this={newEntryInputElement}
                bind:value={newEntryBody}
                on:keydown={handleEntryInputKeydown}
                use:paste={{ handleText: pasteText, handleFiles: pasteFiles }}
                disabled={obfuscated || submitted}
                aria-label="Entry Body"
                placeholder={obfuscated
                    ? ''
                    : useBulletEntryForm
                    ? 'Write a bullet...'
                    : 'Start writing here...'}
                class="text-lg resize-none w-full bg-transparent md:bg-lightAccent"
                class:obfuscated
                class:rounded-lg={useBulletEntryForm}
                class:rounded-b-lg={!useBulletEntryForm}
                class:py-2={useBulletEntryForm}
                class:px-4={useBulletEntryForm}
                class:px-3={!useBulletEntryForm}
                class:md:p-4={!useBulletEntryForm}
            />

            <!--
                same styling as actual input textarea, just hidden so that we
                can measure the height of the text without resizing the actual
                input textarea (and cause weird scrolling)
            -->
            <textarea
                bind:this={textAreaSizeTester}
                class="text-lg resize-none w-full bg-transparent md:bg-lightAccent"
                class:obfuscated
                class:rounded-lg={useBulletEntryForm}
                class:rounded-b-lg={!useBulletEntryForm}
                class:py-2={useBulletEntryForm}
                class:px-4={useBulletEntryForm}
                class:px-3={!useBulletEntryForm}
                class:md:p-4={!useBulletEntryForm}
                style="position: absolute; top: 0; left: -9999px;"
            />
        </div>

        <div class="flex py-1 justify-end">
            <button
                aria-label="Submit Entry"
                class="primary with-icon"
                disabled={submitted}
                on:click={submit}
                style="padding: 2px 5px; margin: 0 0 3px 0;"
            >
                Submit
                <Tick size="26" />
            </button>
        </div>
    {/key}
</div>

<style lang="scss">
    @import '$lib/styles/layout';
    @import '$lib/styles/input';

    .head {
        margin: 0 0 4px 0;
        padding: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;

        @media #{$mobile} {
            border: none;
        }

        .left-options {
            @extend .flex-center;
            height: 100%;
            justify-content: flex-start;
            gap: 3px;
        }

        .right-options {
            height: 100%;
            display: grid;
            grid-template-columns: 1fr auto;
            justify-content: flex-end;
            align-items: center;

            &.blur {
                filter: blur(4px);
            }

            .label-select-container {
                display: grid;
                justify-content: flex-end;
                align-items: center;
            }
        }
    }

    .send-mobile {
        display: none;

        @media #{$mobile} {
            display: flex;
        }
    }

    .entry-title-container {
        @extend .flex-center;
        padding: 0;

        @media #{$mobile} {
            padding: 0;
        }

        input {
            padding: 0.5rem 1rem;
            margin: 0;
            outline: none;
            border: none;
            background: var(--light-accent);
            border-radius: $border-radius $border-radius 0 0;
            border-bottom: 2px solid var(--background-color);
            width: 100%;

            @media #{$mobile} {
                background: transparent;
                border-bottom: 1px solid var(--border-color);
            }
        }
    }

    .entry-container {
        @extend .flex-center;
        width: 100%;

        @media #{$mobile} {
            padding: 0;
        }
    }
</style>
