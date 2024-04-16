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
    import { Entry } from '$lib/controllers/entry/entry';
    import type { Label } from '$lib/controllers/label/label';
    import {
        currentlyUploadingAssets,
        enabledLocation,
        encryptionKey,
        settingsStore,
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
        await goto(`/journal#${entry.id}`);
    }

    async function submit() {
        if (useBulletEntryForm && !newEntryBody) {
            notify.error(`Bullets cannot be empty`);
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

        if (useBulletEntryForm) {
            newEntryInputElement.focus();
        }
    }

    function onNewImage(md: string) {
        insertAtCursor(newEntryInputElement, `\n${md}\n`);
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

    async function uploadAndPasteFiles(files: File[] | FileList) {
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
        setTimeout(resizeTextAreaToFitContent, 0);
        await api.put('/settings', {
            key: 'useBulletEntryForm' satisfies SettingsKey,
            value: mode
        });
    }

    onMount(() => {
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

    $: if (browser) {
        newEntryBody;
        setTimeout(resizeTextAreaToFitContent, 0);
    }
</script>

<div class="md:bg-vLightAccent rounded-2xl">
    {#key useBulletEntryForm}
        <div class="flex justify-between gap-4 p-1">
            <div class="flex gap-1">
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
            <div class="flex justify-end items-center" class:blur={obfuscated}>
                <LabelSelect bind:value={newEntryLabel} {labels} fromRight />
            </div>
        </div>
        {#if !useBulletEntryForm}
            <div class="py-1 px-2">
                <input
                    aria-label="Entry Title"
                    bind:value={newEntryTitle}
                    class="w-full text-lg"
                    style="background: none; border-bottom: 2px solid var(--background-color); padding-inline: 0.5rem; border-radius: 0"
                    class:obfuscated
                    placeholder={obfuscated ? '' : 'Title (optional)'}
                    disabled={obfuscated || submitted}
                />
            </div>
        {/if}
        <div style={useBulletEntryForm ? 'display: grid; grid-template-columns: 1fr auto' : ''}>
            <div>
                <textarea
                    bind:this={newEntryInputElement}
                    bind:value={newEntryBody}
                    on:keydown={handleEntryInputKeydown}
                    use:paste={{ handleText: pasteText, handleFiles: uploadAndPasteFiles }}
                    disabled={obfuscated || submitted}
                    aria-label="Entry Body"
                    placeholder={obfuscated
                        ? ''
                        : useBulletEntryForm
                          ? 'Write a bullet...'
                          : 'Start writing here...'}
                    class="text-lg py-2 resize-none w-full bg-transparent"
                    class:obfuscated
                    class:rounded-lg={useBulletEntryForm}
                    class:rounded-b-lg={!useBulletEntryForm}
                    class:px-4={useBulletEntryForm}
                    class:p-4={!useBulletEntryForm}
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
                    class:rounded-lg={useBulletEntryForm}
                    class:rounded-b-lg={!useBulletEntryForm}
                    class:px-4={useBulletEntryForm}
                    class:p-4={!useBulletEntryForm}
                    style="position: absolute; top: 0; left: -9999px;"
                />
            </div>

            <div class="flex p-2 justify-end">
                <button
                    aria-label="Submit Entry"
                    class="flex-center gap-2 primary"
                    disabled={submitted}
                    on:click={submit}
                >
                    {#if !useBulletEntryForm}
                        Submit
                    {/if}
                    <Tick size="26" />
                </button>
            </div>
        </div>
    {/key}
</div>

<style lang="scss">
    @import '$lib/styles/layout';
    @import '$lib/styles/input';

    .blur {
        filter: blur(4px);
    }
</style>
