<script lang="ts">
    import { browser } from '$app/environment';
    import { beforeNavigate, goto } from '$app/navigation';
    import { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
    import InsertImage from '$lib/components/asset/InsertImage.svelte';
    import { dispatch, listen } from '$lib/dataChangeEvents.js';
    import { serializedAgentData } from '$lib/utils/userAgent';
    import { tooltip } from '@svelte-plugins/tooltips';
    import { onMount } from 'svelte';
    import FormatListBulleted from 'svelte-material-icons/FormatListBulleted.svelte';
    import Send from 'svelte-material-icons/Send.svelte';
    import LabelSelect from '$lib/components/label/LabelSelect.svelte';
    import { STORE_KEY } from '$lib/constants';
    import type { Entry, RawEntry } from '$lib/controllers/entry/entry';
    import type { Label } from '$lib/controllers/label/label';
    import type { Auth } from '$lib/controllers/user/user';
    import { enabledLocation } from '$lib/stores.js';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { getLocation } from '$lib/utils/geolocation';
    import { clientLogger } from '$lib/utils/log';
    import { displayNotifOnErr, notify } from '$lib/components/notifications/notifications';
    import { obfuscate } from '$lib/utils/text';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import FormatOptions from './FormatOptions.svelte';
    import LocationToggle from '../location/LocationToggle.svelte';

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
    export let setEntryFormMode = null as null | ((mode: EntryFormMode) => Promise<void>);

    function resetEntryForm() {
        newEntryTitle = '';
        newEntryBody = '';
        newEntryLabel = '';
    }

    function saveToLS() {
        if (loadFromLS) {
            localStorage.setItem(STORE_KEY.newEntryTitle, newEntryTitle);
            localStorage.setItem(STORE_KEY.newEntryBody, newEntryBody);
            localStorage.setItem(STORE_KEY.newEntryLabel, newEntryLabel);
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

    async function onEntryCreation(body: RawEntry) {
        const res = displayNotifOnErr(await api.post(auth, '/entries', { ...body }));
        submitted = false;
        if (res.id) {
            // make really sure it's saved before resetting
            resetEntryForm();
        } else {
            clientLogger.error(res);
            notify.error(`Failed to create entry: ${JSON.stringify(res)}`);
        }

        const entry = {
            ...body,
            id: res.id,
            flags: 0,
            decrypted: true
        } as Mutable<Entry>;

        if (body.label && labels) {
            entry.label = labels.find(l => l.id === body.label);
            if (!entry.label) {
                notify.error('label not found');
                clientLogger.log('label not found');
            }
        }

        await dispatch.create('entry', {
            entry,
            entryMode: EntryFormMode.Standard
        });
    }

    async function onEntryEdit(body: RawEntry) {
        if (!entry) {
            clientLogger.error('entry must be set when action is edit');
            return;
        }
        if (!areUnsavedChanges()) {
            if (!confirm('No changes have been made, are you sure you want to edit this entry?')) {
                return;
            }
        }
        displayNotifOnErr(await api.put(auth, apiPath('/entries/?', entry.id), body));
        await goto(`/journal/${entry.id}?obfuscate=0`);
    }

    async function submit() {
        submitted = true;

        const currentLocation = $enabledLocation ? await getLocation() : [null, null];

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

    function onNewImage(md: string) {
        insertAtCursor(newEntryInputElement, `\n${md}\n`);
    }

    async function stopSpaceAndEnterBeingInterceptedByFileDrop() {
        // TODO do this properly
        while (!document.getElementsByClassName('entry-file-drop').length) {
            await new Promise(r => setTimeout(r, 50));
        }
        // https://stackoverflow.com/questions/19469881
        for (const el of document.getElementsByClassName('entry-file-drop')) {
            el.addEventListener(
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
        const shouldProceed = confirm('You have unsaved changes, are you sure you want to leave?');
        if (!shouldProceed) {
            cancel();
        }
    });

    onMount(() => {
        void loadLabels();

        if (loadFromLS) {
            newEntryTitle = localStorage.getItem(STORE_KEY.newEntryTitle) || '';
            newEntryBody = localStorage.getItem(STORE_KEY.newEntryBody) || '';
            newEntryLabel = localStorage.getItem(STORE_KEY.newEntryLabel) || '';

            if (!newEntryBody && !newEntryTitle) {
                obfuscated = false;
            }
        }
        mounted = true;

        void stopSpaceAndEnterBeingInterceptedByFileDrop();
    });

    let mounted = false;

    let newEntryInputElement: HTMLTextAreaElement;
    let labels = null as Label[] | null;

    listen.label.onCreate(label => {
        labels = [...(labels || []), label];
    });
    listen.label.onUpdate(label => {
        if (labels === null) {
            clientLogger.error('labels should not be null');
            return;
        }
        labels = labels.map(l => (l.id === label.id ? label : l));
    });
    listen.label.onDelete(id => {
        if (labels === null) {
            clientLogger.error('labels should not be null');
            return;
        }
        labels = labels.filter(l => l.id !== id);
    });

    let submitted = false;

    $: if (mounted && browser && loadFromLS) {
        // be reactive on these
        [newEntryTitle, newEntryBody, newEntryLabel];
        saveToLS();
    }
</script>

<div class="wrapper">
    <div class="head">
        <div class="left-options">
            {#if setEntryFormMode}
                <button
                    aria-label="Switch to bullet journaling"
                    class="with-circled-icon"
                    on:click={() => setEntryFormMode?.(EntryFormMode.Bullet)}
                    style="margin: 0"
                    use:tooltip={{
                        content: 'Switch to Bullet Journaling',
                        position: 'right'
                    }}
                >
                    <FormatListBulleted size="30" />
                </button>
            {/if}

            <LocationToggle />

            <FormatOptions {makeWrapper} />

            <InsertImage {auth} onInput={onNewImage} />
        </div>
        <div class="right-options {obfuscated ? 'blur' : ''}">
            <div class="label-select-container">
                <LabelSelect {auth} bind:value={newEntryLabel} {labels} fromRight />
            </div>

            <button
                aria-label="Submit Entry"
                class="primary with-icon hide-mobile"
                disabled={submitted}
                on:click={submit}
                style="padding: 2px 5px; margin: 0 0 3px 0;"
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
            <textarea placeholder="..." aria-label="Entry Body" disabled class="obfuscated"
                >{obfuscate(newEntryBody)}</textarea
            >
        {:else}
            <textarea
                bind:this={newEntryInputElement}
                bind:value={newEntryBody}
                on:keydown={handleEntryInputKeydown}
                disabled={submitted}
                aria-label="Entry Body"
                placeholder="Start writing here..."
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

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/layout';
    @import '../../../styles/input';

    .wrapper {
        margin: 1rem;
        width: calc(100% - 2rem);

        @media @mobile {
            margin: 1rem 0;
            width: 100%;
        }

        & > div {
            width: 100%;
            min-width: 200px;
        }

        @media @mobile {
            border: none;
        }
    }

    .head {
        margin: 0 0 4px 0;
        padding: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;

        @media @mobile {
            border: none;
        }

        .left-options {
            .flex-center();
            height: 100%;
            justify-content: start;
            gap: 3px;

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
            background: var(--light-accent);
            border-radius: @border-radius @border-radius 0 0;
            border-bottom: 2px solid var(--background-color);
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
            background: var(--light-accent);
            border-radius: 0 0 @border-radius @border-radius;

            // fills page
            height: min(calc(100vh - 12rem), 300px);

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
