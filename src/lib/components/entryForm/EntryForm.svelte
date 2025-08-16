<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import MenuBar from '$lib/components/entryForm/MenuBar.svelte';
    import { Button } from '$lib/components/ui/button';
    import { Asset } from '$lib/controllers/asset/asset';
    import { dispatch, listen } from '$lib/dataChangeEvents';
    import { Result } from '$lib/utils/result';
    import { serializedAgentData } from '$lib/utils/userAgent';
    import { Entry } from '$lib/controllers/entry/entry';
    import type { Label } from '$lib/controllers/label/label';
    import { enabledLocation, encryptionKey, username } from '$lib/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { getLocation, nullLocation } from '$lib/utils/geolocation';
    import { notify } from '$lib/components/notifications/notifications';
    import { wordCount } from '$lib/utils/text';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import { decrypt, encrypt } from '$lib/utils/encryption';
    import { CSLogger } from '$lib/controllers/logs/logger.client';
    import { cn } from '$lib/utils';
    import LocationToggle from '$lib/components/location/LocationToggle.svelte';
    import Enter from '$lib/components/ui/icons/Enter.svelte';
    import { paste } from './paste';

    // as this form is used in entry editing and creating
    export let action: 'create' | 'edit' = 'create';

    export let entry: Entry | null = null;
    if (entry && action !== 'edit') {
        throw new Error('entry can only be set when action is edit');
    }
    if (!entry && action === 'edit') {
        throw new Error('entry must be set when action is edit');
    }

    export let newEntryTitle = '';
    export let newEntryBody = '';
    export let newEntryLabelId = '';
    export let labels: Record<string, Label>;
    export let obfuscated = true;
    let className = '';
    export { className as class };
    export let menuBarClass = '';

    function resetEntryForm() {
        newEntryTitle = '';
        newEntryBody = '';
        newEntryLabelId = '';
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
        localStorage.setItem(Entry.labelLsKey($username, entry), newEntryLabelId);
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
            .mapErr(() => notify.error('Failed to decrypt saved entry body'))
            .or('');
        newEntryLabelId = localStorage.getItem(Entry.labelLsKey($username, entry)) || '';
    }

    function areUnsavedChanges() {
        if (!entry) return false;

        // check for unsaved changes
        return (
            entry.title !== newEntryTitle ||
            entry.body !== newEntryBody ||
            (entry.labelId || '') !== newEntryLabelId
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

    function wrapSelectedWith(before: string, after: string, insertSpaceIfEmpty = true) {
        const input = newEntryInputElement;
        if (!input) {
            void CSLogger.error('input element not found', { before, after, entry, action });
            return;
        }
        const selected = input.value.substring(input.selectionStart ?? 0, input.selectionEnd ?? 0);
        if (selected.length === 0 && insertSpaceIfEmpty) {
            insertAtCursor(input, `${before} ${after}`);
            return;
        }
        insertAtCursor(input, before + selected + after);
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
            void CSLogger.error('failed to make entry', { id, body, entry, action });
            notify.error(`Failed to create entry`);
            return;
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
            labelId: body.labelId,
            edits: []
        });
    }

    async function onEntryEdit(body: EntryPostPayload) {
        if (!entry) {
            void CSLogger.error('entry must be set when action is edit', { entry, action });
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
            labelId: newEntryLabelId,
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

        for (const { publicId, fileName, id } of uploadedImages) {
            insertImage(Asset.generateMarkdownLink(fileName, publicId));
            await dispatch.create('asset', { id, created: nowUtc(), publicId, fileName });
        }
    }

    function insertImage(md: string) {
        wrapSelectedWith(md, '', false);
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

    $: if (mounted && browser && [newEntryTitle, newEntryBody, newEntryLabelId]) {
        saveToLS();
    }

    $: if (browser && [newEntryBody]) {
        setTimeout(resizeTextAreaToFitContent, 0);
    }
</script>

<div class={cn('md:bg-vLightAccent rounded-2xl', className)}>
    <div class="pb-2 md:pb-4 md:px-1">
        <MenuBar
            {labels}
            {wrapSelectedWith}
            bind:newEntryLabelId
            bind:entryTitle={newEntryTitle}
            class={menuBarClass}
        />
    </div>
    <div class="px-2">
        <div>
            <textarea
                bind:this={newEntryInputElement}
                bind:value={newEntryBody}
                on:keydown={handleEntryInputKeydown}
                use:paste={{ handleText: pasteText, handleFiles: uploadAndPasteFiles }}
                disabled={obfuscated || submitted}
                aria-label="Entry Body"
                placeholder={obfuscated ? '' : 'What’s on your mind?'}
                class="text-lg py-2 resize-none w-full bg-transparent border-0 border-b border-solid border-border"
                class:obfuscated
            />

            <!--
                same styling as actual input textarea, just hidden so that we
                can measure the height of the text without resizing the actual
                input textarea (and cause weird scrolling)
            -->
            <textarea
                bind:this={textAreaSizeTester}
                class="text-lg py-2 resize-none w-full bg-transparent"
                class:obfuscated
                style="position: absolute; top: 0; left: -9999px;"
            />
        </div>

        <div class="flex py-2 justify-end gap-2">
            <LocationToggle size={23} />


                    <Button
                        aria-label="Submit Entry"
                        disabled={submitted}
                        on:click={submit}
                        class="rounded-full flex-center gap-2"
                        variant="default"
                        data-tooltip-trigger
                        data-melt-tooltip-trigger
                        data-state="closed"
                    >
                        Submit <Enter size="20" />
                    </Button>

        </div>
    </div>
</div>
