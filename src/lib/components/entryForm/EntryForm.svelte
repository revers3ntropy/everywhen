<script lang="ts">
    import { ANIMATION_DURATION } from '$lib/constants';
    import Tick from 'svelte-material-icons/Check.svelte';
    import UploadMultiple from 'svelte-material-icons/UploadMultiple.svelte';
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import InsertImage from '$lib/components/asset/InsertImage.svelte';
    import { Asset } from '$lib/controllers/asset/asset';
    import { dispatch, listen } from '$lib/dataChangeEvents';
    import { Result } from '$lib/utils/result';
    import { serializedAgentData } from '$lib/utils/userAgent';
    import LabelSelect from '$lib/components/label/LabelSelect.svelte';
    import { Entry } from '$lib/controllers/entry/entry';
    import type { Label } from '$lib/controllers/label/label';
    import {
        currentlyUploadingAssets,
        enabledLocation,
        encryptionKey,
        username
    } from '$lib/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { getLocation, nullLocation } from '$lib/utils/geolocation';
    import { clientLogger } from '$lib/utils/log';
    import { notify } from '$lib/components/notifications/notifications';
    import { wordCount } from '$lib/utils/text';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import FormatOptions from './FormatOptions.svelte';
    import LocationToggle from '../location/LocationToggle.svelte';
    import { paste } from './paste';
    import { decrypt, encrypt } from '$lib/utils/encryption';
    import { slide } from 'svelte/transition';

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
    export let labels: Record<string, Label>;
    export let obfuscated = true;

    function resetEntryForm() {
        newEntryTitle = '';
        newEntryBody = '';
        newEntryLabel = '';
    }

    function saveToLS() {
        localStorage.setItem(
            Entry.titleLsKey($username, entry),
            encrypt(newEntryTitle, $encryptionKey)
        );
        localStorage.setItem(
            Entry.bodyLsKey($username, entry),
            encrypt(newEntryBody, $encryptionKey)
        );
        localStorage.setItem(Entry.labelLsKey($username, entry), newEntryLabel);
    }

    function restoreFromLS() {
        // if nothing is saved, don't restore.
        // particularly important for editing entries
        if (localStorage.getItem(Entry.bodyLsKey($username, entry)) === null) return;
        newEntryTitle = decrypt(
            localStorage.getItem(Entry.titleLsKey($username, entry)) || '',
            $encryptionKey
        )
            .mapErr(() => notify.error('Failed to decrypt saved entry title'))
            .or('');
        newEntryBody = decrypt(
            localStorage.getItem(Entry.bodyLsKey($username, entry)) || '',
            $encryptionKey
        )
            .mapErr(() => notify.error('Failed to decrypt saved entry title'))
            .or('');
        newEntryLabel = localStorage.getItem(Entry.labelLsKey($username, entry)) || '';
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
            label = labels[body.labelId] ?? null;
            if (!label) notify.error('label not found');
        }

        await dispatch.create('entry', {
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
        await goto(`/journal#${entry.id}`);
    }

    async function submit() {
        if (!newEntryBody) {
            notify.error(`Entries cannot be empty`);
            return;
        }

        submitted = true;

        const currentLocation = $enabledLocation ? await getLocation() : nullLocation();

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

        newEntryInputElement.focus();
    }

    function onNewImage(md: string) {
        insertAtCursor(newEntryInputElement, `\n${md}\n`);
    }

    function resizeTextAreaToFitContent() {
        textAreaSizeTester.value = newEntryBody;
        textAreaSizeTester.style.height = '0px';
        textAreaSizeTester.style.width = `${newEntryInputElement.clientWidth}px`;
        const minBodyTextareaHeight = 20;
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
                    break;
                }
                event.preventDefault();
                void submit();
                break;
            }
        }
    }

    function pasteText(text: string) {
        insertAtCursor(newEntryInputElement, text);
    }

    async function uploadAndPasteFiles(files: File[] | FileList) {
        const [uploadedImages, errors] = Result.filter(await Asset.uploadImages(files));

        notify.error(errors);

        for (const { publicId, fileName } of uploadedImages) {
            onNewImage(Asset.generateMarkdownLink(fileName, publicId));
        }
    }

    onMount(() => {
        restoreFromLS();

        if (!newEntryBody && !newEntryTitle) {
            obfuscated = false;
        }

        resizeTextAreaToFitContent();

        mounted = true;
    });

    let mounted = false;

    let textAreaSizeTester: HTMLTextAreaElement;
    let newEntryInputElement: HTMLTextAreaElement;

    listen.label.onCreate(label => {
        labels[label.id] = label;
    });
    listen.label.onUpdate(label => {
        labels[label.id] = label;
    });
    listen.label.onDelete(id => {
        delete labels[id];
    });

    let submitted = false;

    $: if (mounted && browser && [newEntryTitle, newEntryBody, newEntryLabel]) {
        saveToLS();
    }

    $: if (browser && [newEntryBody]) {
        setTimeout(resizeTextAreaToFitContent, 0);
    }
</script>

<div class="md:bg-vLightAccent rounded-2xl">
    <div class="md:px-2 pb-2 md:pb-4">
        <div class="flex items-center bg-lightAccent md:rounded-full md:w-fit">
            <div class="flex items-center gap-2 py-1 px-2 md:px-4 w-fit">
                <LocationToggle size={23} />

                <FormatOptions {makeWrapper} />

                <InsertImage onInput={onNewImage} />

                <div class="pl-2">
                    <LabelSelect bind:value={newEntryLabel} {labels} fromRight />
                </div>
            </div>

            {#if $currentlyUploadingAssets > 0}
                <div
                    class="flex-center h-full px-2 py-1 border border-textColor rounded-full"
                    transition:slide={{ duration: ANIMATION_DURATION, axis: 'x' }}
                >
                    <UploadMultiple size="26" />
                    {$currentlyUploadingAssets}
                </div>
            {/if}
        </div>
    </div>
    <div>
        <div>
            <textarea
                bind:this={newEntryInputElement}
                bind:value={newEntryBody}
                on:keydown={handleEntryInputKeydown}
                use:paste={{ handleText: pasteText, handleFiles: uploadAndPasteFiles }}
                disabled={obfuscated || submitted}
                aria-label="Entry Body"
                placeholder={obfuscated ? '' : 'Start writing here...'}
                class="text-lg py-2 resize-none w-full bg-transparent rounded-lg px-4"
                class:obfuscated
            />

            <!--
                same styling as actual input textarea, just hidden so that we
                can measure the height of the text without resizing the actual
                input textarea (and cause weird scrolling)
            -->
            <textarea
                bind:this={textAreaSizeTester}
                class="text-lg py-2 resize-none w-full bg-transparent rounded-lg px-4"
                class:obfuscated
                style="position: absolute; top: 0; left: -9999px;"
            />
        </div>

        <div class="flex p-2 justify-end">
            <button
                aria-label="Submit Entry"
                class="flex-center aspect-square primary"
                disabled={submitted}
                on:click={submit}
            >
                <Tick size="26" />
            </button>
        </div>
    </div>
</div>
