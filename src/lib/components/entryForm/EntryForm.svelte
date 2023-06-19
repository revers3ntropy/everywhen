<script lang="ts">
    import { browser } from '$app/environment';
    import { beforeNavigate, goto } from '$app/navigation';
    import { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
    import { dispatch } from '$lib/dataChangeEvents.js';
    import { serializedAgentData } from '$lib/utils/userAgent';
    import { tooltip } from '@svelte-plugins/tooltips';
    import { filedrop, type Files } from 'filedrop-svelte';
    import { onMount } from 'svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import ImageArea from 'svelte-material-icons/ImageArea.svelte';
    import Send from 'svelte-material-icons/Send.svelte';
    import LabelSelect from '$lib/components/label/LabelSelect.svelte';
    import { LS_KEY, MAX_IMAGE_SIZE } from '$lib/constants';
    import { Asset } from '$lib/controllers/asset';
    import type { Entry, RawEntry } from '$lib/controllers/entry';
    import { Label } from '$lib/controllers/label';
    import type { Auth } from '$lib/controllers/user';
    import { enabledLocation } from '$lib/stores.js';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { getFileContents } from '$lib/utils/files';
    import { getLocation } from '$lib/utils/geolocation';
    import { errorLogger } from '$lib/utils/log';
    import {
        displayNotifOnErr,
        notify
    } from '$lib/notifications/notifications';
    import { obfuscate } from '$lib/utils/text';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import type { Mutable } from '../../../app';
    import FormatOptions from './FormatOptions.svelte';
    import LocationToggle from './LocationToggle.svelte';

    let mounted = false;

    // as this form is used in entry editing and creating
    export let action: 'create' | 'edit' = 'create';

    export let entry: Entry | null = null;
    if (entry && action !== 'edit') {
        throw new Error('eventID can only be set when action is edit');
    }

    export let loadFromLS = true;

    export let newEntryTitle = '';
    export let newEntryBody = '';
    export let newEntryLabel = '';

    export let auth: Auth;
    export let obfuscated = true;

    function resetEntryForm() {
        newEntryTitle = '';
        newEntryBody = '';
        newEntryLabel = '';
    }

    function saveToLS() {
        if (loadFromLS) {
            localStorage.setItem(LS_KEY.newEntryTitle, newEntryTitle);
            localStorage.setItem(LS_KEY.newEntryBody, newEntryBody);
            localStorage.setItem(LS_KEY.newEntryLabel, newEntryLabel);
        }
    }

    function areUnsavedChanges() {
        if (!entry || loadFromLS) {
            return false;
        }
        // check for unsaved changes
        return (
            entry.title !== newEntryTitle ||
            entry.entry !== newEntryBody ||
            (entry.label?.id || '') !== newEntryLabel
        );
    }

    /**
     * @src https://stackoverflow.com/questions/11076975
     */
    function insertAtCursor(
        input: HTMLInputElement | HTMLTextAreaElement,
        text: string
    ) {
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
        const selected = input.value.substring(
            input.selectionStart ?? 0,
            input.selectionEnd ?? 0
        );
        if (selected.length === 0 && insertSpaceIfEmpty) {
            insertAtCursor(input, `${before} ${after}`);
            return;
        }
        insertAtCursor(input, before + selected + after);
    }

    function makeWrapper(
        before: string,
        after: string,
        insertSpaceIfEmpty = true
    ): () => void {
        return () => {
            if (newEntryInputElement) {
                wrapSelectedWith(
                    newEntryInputElement,
                    before,
                    after,
                    insertSpaceIfEmpty
                );
            }
        };
    }

    async function onEntryCreation(body: RawEntry) {
        const res = displayNotifOnErr(
            await api.post(auth, '/entries', { ...body })
        );
        submitted = false;
        if (res.id) {
            // make really sure it's saved before resetting
            resetEntryForm();
        } else {
            errorLogger.error(res);
            notify.error(`Failed to create entry: ${JSON.stringify(res)}`);
        }

        const entry = {
            ...body,
            id: res.id,
            deleted: false,
            decrypted: true
        } as Mutable<Entry>;

        if (body.label && labels) {
            const { val: label, err } = await Label.withIdFromListOrFetch(
                api,
                auth,
                body.label,
                labels
            );
            if (err) {
                errorLogger.error(err);
                notify.error('Label not found');
            }
            entry.label = label;
        }

        await dispatch.create('entry', {
            entry,
            entryMode: EntryFormMode.Standard
        });
    }

    async function onEntryEdit(body: RawEntry) {
        if (!entry) {
            throw new Error('entry must be set when action is edit');
        }
        if (!areUnsavedChanges()) {
            if (
                !confirm(
                    'No changes have been made, are you sure you want to edit this entry?'
                )
            ) {
                return;
            }
        }
        displayNotifOnErr(
            await api.put(auth, apiPath('/entries/?', entry.id), body)
        );
        await goto(`/journal/${entry.id}?obfuscate=0`);
    }

    async function submit() {
        submitted = true;

        const currentLocation = $enabledLocation
            ? await getLocation()
            : [null, null];

        const body = {
            title: newEntryTitle,
            entry: newEntryBody,
            label: newEntryLabel,
            latitude: currentLocation[0],
            longitude: currentLocation[1],
            created: nowUtc(),
            agentData: serializedAgentData(),
            createdTZOffset: currentTzOffset()
        } as RawEntry;

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
    }

    async function onFileDrop(e: CustomEvent<{ files: Files }>) {
        const files = e.detail.files;
        if (files.rejected.length > 0) {
            notify.error('File could not be read, please try again');
            return;
        }
        if (files.accepted.length < 1) return;
        if (files.accepted.length !== 1) {
            notify.error('Please select exactly one file');
            return;
        }
        const file = files.accepted[0];
        const content = displayNotifOnErr(await getFileContents(file, 'b64'));

        if (!content) return;
        if (content.length > MAX_IMAGE_SIZE) {
            notify.error('Image is too large');
            return;
        }

        const { id } = displayNotifOnErr(
            await api.post(auth, '/assets', {
                fileName: file.name,
                content
            })
        );

        // insert markdown to link to image
        insertAtCursor(
            newEntryInputElement,
            `\n${Asset.markDownLink(file.name, id)}\n`
        );
    }

    async function stopSpaceAndEnterBeingInterceptedByFileDrop() {
        // TODO do this properly
        while (!document.getElementsByClassName('entry-file-drop').length) {
            await new Promise(r => setTimeout(r, 50));
        }
        // https://stackoverflow.com/questions/19469881
        document.getElementsByClassName('entry-file-drop')[0].addEventListener(
            'keydown',
            (event: Event) => {
                const e = event as KeyboardEvent;
                // same check as lib uses
                if (e.key === ' ' || e.key === 'Enter') {
                    e.stopImmediatePropagation();
                }
            },
            true
        );
    }

    function triggerFileDrop() {
        // bit hacky... TODO make less hacky
        (
            document.querySelector(
                '.entry-file-drop > input'
            ) as HTMLInputElement
        ).click();
    }

    async function loadLabels() {
        labels = displayNotifOnErr(await api.get(auth, '/labels')).labels;
    }

    function handleEntryInputKeydown(event: KeyboardEvent) {
        if (event.key !== 'Tab') return;
        event.preventDefault();
        insertAtCursor(newEntryInputElement, '\t');
    }

    beforeNavigate(({ cancel }) => {
        // would save to LS here, except sometimes we want to navigate away
        // after editing something in LS, for example making 'Dream' entry from navbar
        // in which case saving would override anything we set there.

        if (submitted || !areUnsavedChanges()) {
            return;
        }
        const shouldProceed = confirm(
            'You have unsaved changes, are you sure you want to leave?'
        );
        if (!shouldProceed) {
            cancel();
        }
    });

    onMount(() => {
        void loadLabels();

        if (loadFromLS) {
            newEntryTitle = localStorage.getItem(LS_KEY.newEntryTitle) || '';
            newEntryBody = localStorage.getItem(LS_KEY.newEntryBody) || '';
            newEntryLabel = localStorage.getItem(LS_KEY.newEntryLabel) || '';

            if (!newEntryBody && !newEntryTitle) {
                obfuscated = false;
            }
        }
        mounted = true;

        void stopSpaceAndEnterBeingInterceptedByFileDrop();
    });

    let newEntryInputElement: HTMLTextAreaElement;

    // only used by LabelSelect which handles changes itself
    let labels = null as Label[] | null;

    let submitted = false;

    $: if (mounted && browser && loadFromLS) {
        // be reactive on these
        [newEntryTitle, newEntryBody, newEntryLabel];
        saveToLS();
    }
</script>

<div
    class="wrapper entry-file-drop"
    on:filedrop={onFileDrop}
    use:filedrop={{
        fileLimit: 1,
        windowDrop: false,
        hideInput: true,
        clickToUpload: false,
        tabIndex: -1,
        multiple: false,
        accept: 'image/*',
        id: 'entry-file-drop'
    }}
>
    <div>
        <div class="head">
            <div class="left-options">
                <button
                    aria-label={obfuscated
                        ? 'Show entry form'
                        : 'Hide entry form'}
                    on:click={() => (obfuscated = !obfuscated)}
                    class="hide-mobile"
                >
                    {#if obfuscated}
                        <Eye size="25" />
                    {:else}
                        <EyeOff size="25" />
                    {/if}
                </button>

                <FormatOptions {makeWrapper} />
                <button
                    aria-label="Insert Image"
                    disabled={submitted}
                    on:click={triggerFileDrop}
                    use:tooltip={{
                        content: 'Upload Image',
                        position: 'bottom'
                    }}
                >
                    <ImageArea size="30" />
                </button>

                <LocationToggle />
            </div>
            <div class="right-options {obfuscated ? 'blur' : ''}">
                <div class="label-select-container">
                    <LabelSelect
                        {auth}
                        bind:value={newEntryLabel}
                        {labels}
                        fromRight
                    />
                </div>

                <button
                    aria-label="Submit Entry"
                    class="primary with-icon hide-mobile"
                    disabled={submitted}
                    on:click={submit}
                    style="padding: 2px 5px !important;"
                >
                    Submit
                    <Send size="26" />
                </button>
            </div>
        </div>
        <div class="entry-title-container">
            {#if obfuscated}
                <input
                    aria-label="Entry Title"
                    value={obfuscate(newEntryTitle)}
                    class="title obfuscated"
                    disabled
                    placeholder="..."
                />
            {:else}
                <input
                    aria-label="Entry Title"
                    bind:value={newEntryTitle}
                    class="title"
                    placeholder="Title (optional)"
                    disabled={submitted}
                />
            {/if}
        </div>
        <div class="entry-container">
            {#if obfuscated}
                <textarea
                    placeholder="..."
                    aria-label="Entry Body"
                    disabled
                    class="obfuscated">{obfuscate(newEntryBody)}</textarea
                >
            {:else}
                <!-- svelte-ignore a11y-autofocus -->
                <textarea
                    bind:this={newEntryInputElement}
                    bind:value={newEntryBody}
                    on:keydown={handleEntryInputKeydown}
                    disabled={submitted}
                    aria-label="Entry Body"
                    autofocus
                />
            {/if}
        </div>

        <div class="send-mobile flex-center">
            <button
                aria-label="Submit Entry"
                class="primary with-icon"
                disabled={submitted}
                on:click={submit}
            >
                <Send size="30" />
                Submit Entry
            </button>
        </div>
    </div>
</div>

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/layout';
    @import '../../../styles/input';

    .wrapper {
        margin: 0;
        .flex-center();

        & > div {
            width: min(100%, 700px);
            min-width: 200px;
        }

        @media @mobile {
            border: none;
        }
    }

    .head {
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;

        @media @mobile {
            border: none;
        }

        .left-options {
            height: 100%;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: start;
            align-items: center;
            gap: 0.5rem;

            .title {
                border: none;
                font-size: 20px;
                width: calc(100% - 50px);
                margin: 0 0 0.2rem 0.3em;

                @media @mobile {
                    width: calc(100vw - 70px);
                    margin: 0.3em;
                    border-bottom: 1px solid var(--border-light);
                }
            }
        }

        .right-options {
            height: 100%;
            display: grid;
            grid-template-columns: 1fr auto;
            justify-content: end;
            align-items: center;

            &.blur {
                filter: blur(4px);
            }

            .label-select-container {
                display: grid;
                justify-content: end;
                align-items: center;
            }
        }
    }

    .send-mobile {
        display: none;

        @media @mobile {
            display: flex;
        }
    }

    .entry-title-container {
        .flex-center();
        padding: 0;

        @media @mobile {
            padding: 0;
        }

        input {
            padding: 0.5rem 1rem;
            margin: 0;
            outline: none;
            border: none;
            font-size: 20px;
            background: var(--v-light-accent);
            border-radius: @border-radius @border-radius 0 0;
            border-bottom: 2px solid var(--bg);
            width: 100%;

            @media @mobile {
                background: transparent;
                border-bottom: 1px solid var(--border-color);
            }
        }
    }

    .entry-container {
        .flex-center();
        padding: 0 0 1rem 0;
        width: 100%;

        @media @mobile {
            padding: 0;
        }

        textarea {
            resize: both;
            padding: 1rem;
            margin: 0;
            width: 100%;
            outline: none;
            border: none;
            font-size: 20px;
            background: var(--v-light-accent);
            border-radius: 0 0 @border-radius @border-radius;

            // fills page
            height: min(calc(100vh - 12rem), 600px);

            @media @mobile {
                // annoying on mobile to resize horizontally
                resize: vertical;

                // puts submit button at bottom of screen nicely
                height: calc(100vh - 19rem);
                width: calc(100% - 0.8em);
                overflow-y: scroll;
                margin: 0;
                background: none;
                padding: 0.8rem 0.5rem;
            }
        }
    }
</style>
