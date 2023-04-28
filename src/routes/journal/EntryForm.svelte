<script lang="ts">
    import { browser } from '$app/environment';
    import { beforeNavigate, goto } from '$app/navigation';
    import { tooltip } from '@svelte-plugins/tooltips';
    import {
        filedrop,
        type FileDropOptions,
        type Files
    } from 'filedrop-svelte';
    import { createEventDispatcher, onMount } from 'svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import ImageArea from 'svelte-material-icons/ImageArea.svelte';
    import Send from 'svelte-material-icons/Send.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import LabelSelect from '../../lib/components/LabelSelect.svelte';
    import { LS_KEY, MAX_IMAGE_SIZE } from '../../lib/constants';
    import { Asset } from '../../lib/controllers/asset';
    import type { Entry, RawEntry } from '../../lib/controllers/entry';
    import type { Label } from '../../lib/controllers/label';
    import type { Auth } from '../../lib/controllers/user';
    import { addEntryListeners, enabledLocation } from '../../lib/stores.js';
    import { api, apiPath } from '../../lib/utils/apiRequest';
    import { getFileContents } from '../../lib/utils/files';
    import { getLocation } from '../../lib/utils/geolocation';
    import { errorLogger } from '../../lib/utils/log';
    import {
        displayNotifOnErr,
        ERR_NOTIFICATION,
        SUCCESS_NOTIFICATION
    } from '../../lib/utils/notifications';
    import { obfuscate } from '../../lib/utils/text';
    import { nowUtc } from '../../lib/utils/time';
    import LocationToggle from './LocationToggle.svelte';

    const { addNotification } = getNotificationsContext();
    const dispatch = createEventDispatcher();

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

    let newEntryInputElement: HTMLTextAreaElement;

    export function reset() {
        newEntryTitle = '';
        newEntryBody = '';
        newEntryLabel = '';
    }

    $: if (mounted && browser && loadFromLS) {
        // be reactive on these
        [newEntryTitle, newEntryBody, newEntryLabel];
        saveToLS();
    }

    function saveToLS() {
        if (loadFromLS) {
            localStorage.setItem(LS_KEY.newEntryTitle, newEntryTitle);
            localStorage.setItem(LS_KEY.newEntryBody, newEntryBody);
            localStorage.setItem(LS_KEY.newEntryLabel, newEntryLabel);
        }
    }

    onMount(() => {
        if (loadFromLS) {
            newEntryTitle = localStorage.getItem(LS_KEY.newEntryTitle) || '';
            newEntryBody = localStorage.getItem(LS_KEY.newEntryBody) || '';
            newEntryLabel = localStorage.getItem(LS_KEY.newEntryLabel) || '';

            if (!newEntryBody && !newEntryLabel && !newEntryTitle) {
                obfuscated = false;
            }
        }
        mounted = true;
    });

    function serializeAgentData(): string {
        return JSON.stringify({
            userAgent: navigator.userAgent,
            language: navigator.language,
            appVersion: navigator.appVersion,
            platform: navigator.platform
        });
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

    let submitted = false;

    beforeNavigate(({ cancel }) => {
        // would save to LS here, except sometimes we want to navigate away
        // after editing something in LS, for example making 'Dream' entry from navbar
        // in which case saving would override anything we set there.
        // Should be fine, as we always save whenever the local variables which store the form
        // contents are changed.

        if (!submitted && areUnsavedChanges()) {
            if (
                !confirm(
                    'You have unsaved changes, are you sure you want to leave?'
                )
            ) {
                cancel();
            }
        }
    });

    async function onEntryCreation(body: RawEntry) {
        const res = displayNotifOnErr(
            addNotification,
            await api.post(auth, '/entries', body)
        );
        submitted = false;
        if (res.id) {
            // make really sure it's saved before resetting
            reset();
        } else {
            errorLogger.error(res);
            addNotification({
                ...ERR_NOTIFICATION,
                text: `Failed to create entry: ${JSON.stringify(res)}`
            });
        }
        addNotification({
            ...SUCCESS_NOTIFICATION,
            removeAfter: 1000,
            text: `Entry created`
        });
        $addEntryListeners.map(e => e());
        await goto(`#${res.id}`);
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
            addNotification,
            await api.put(auth, apiPath('/entries/?', entry.id), body)
        );
        await goto(`/journal/${entry.id}?obfuscate=0`);
    }

    async function submit() {
        submitted = true;

        const currentLocation = $enabledLocation
            ? await getLocation(addNotification)
            : [null, null];

        const body = {
            title: newEntryTitle,
            entry: newEntryBody,
            label: newEntryLabel,
            latitude: currentLocation[0],
            longitude: currentLocation[1],
            created: nowUtc(),
            agentData: serializeAgentData()
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

        dispatch('updated');
    }

    const fileOptions: FileDropOptions = {
        fileLimit: 1,
        windowDrop: false,
        hideInput: true,
        clickToUpload: false,
        tabIndex: -1,
        multiple: false,
        accept: 'image/*',
        id: 'entry-file-drop'
    };

    async function onFileDrop(e: CustomEvent<{ files: Files }>) {
        const files = e.detail.files;
        if (files.rejected.length > 0) {
            addNotification({
                ...ERR_NOTIFICATION,
                text: 'File could not be read, please try again'
            });
            return;
        }
        if (files.accepted.length < 1) return;
        if (files.accepted.length !== 1) {
            addNotification({
                ...ERR_NOTIFICATION,
                text: 'Please select exactly one file'
            });
            return;
        }
        const file = files.accepted[0];
        const content = displayNotifOnErr(
            addNotification,
            await getFileContents(file, 'b64')
        );

        if (!content) return;
        if (content.length > MAX_IMAGE_SIZE) {
            addNotification({
                ...ERR_NOTIFICATION,
                text: 'File too large'
            });
            return;
        }

        const { id } = displayNotifOnErr(
            addNotification,
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
        while (!document.getElementsByClassName('entry-file-drop')) {
            await new Promise(r => setTimeout(r, 100));
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

    let labels: Label[] | null = null;

    async function loadLabels() {
        const labelsRes = displayNotifOnErr(
            addNotification,
            await api.get(auth, '/labels')
        );
        labels = labelsRes.labels;
    }

    function handleEntryInputKeydown(event: KeyboardEvent) {
        if (event.key !== 'Tab') return;
        event.preventDefault();
        insertAtCursor(newEntryInputElement, '\t');
    }

    onMount(async () => {
        await Promise.all([
            loadLabels(),
            stopSpaceAndEnterBeingInterceptedByFileDrop()
        ]);
    });
</script>

<div
    class="container entry-file-drop"
    on:filedrop={onFileDrop}
    use:filedrop={fileOptions}
>
    <div class="head">
        <div class="left-options">
            <button
                aria-label={obfuscated ? 'Show entry form' : 'Hide entry form'}
                on:click={() => (obfuscated = !obfuscated)}
            >
                {#if obfuscated}
                    <Eye size="25" />
                {:else}
                    <EyeOff size="25" />
                {/if}
            </button>
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
                    placeholder="Title"
                    disabled={submitted}
                />
            {/if}
        </div>
        <div class="right-options {obfuscated ? 'blur' : ''}">
            <button
                aria-label="Insert Image"
                disabled={submitted}
                on:click={triggerFileDrop}
                use:tooltip={{
                    content: 'Insert Image',
                    position: 'bottom'
                }}
            >
                <ImageArea size="30" />
            </button>

            <LocationToggle />

            <LabelSelect {auth} bind:value={newEntryLabel} {labels} />

            <button
                aria-label="Submit Entry"
                class="primary with-icon send"
                disabled={submitted}
                on:click={submit}
            >
                <Send size="30" />
                Submit
            </button>
        </div>
    </div>
    <div class="entry-container">
        {#if obfuscated}
            <textarea placeholder="..." disabled class="obfuscated"
                >{obfuscate(newEntryBody)}</textarea
            >
        {:else}
            <textarea
                bind:this={newEntryInputElement}
                bind:value={newEntryBody}
                on:keydown={handleEntryInputKeydown}
                placeholder="Entry"
                disabled={submitted}
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
    @import '../../styles/variables';
    @import '../../styles/layout';
    @import '../../styles/input';

    .container {
        margin: 0;

        @media @mobile {
            border: none;
        }
    }

    .head {
        margin: 0;
        padding: 0 0.4em;
        border-bottom: 1px solid @border-light;
        display: grid;
        grid-template-columns: 1fr 28rem;

        @media @mobile {
            display: flex;
            flex-wrap: wrap;
            border: none;
        }

        .left-options {
            height: 100%;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: start;
            align-items: center;

            .title {
                border: none;
                font-size: 20px;
                width: calc(100% - 50px);
                margin: 0 0 0.2rem 0.3em;

                @media @mobile {
                    width: calc(100vw - 70px);
                    margin: 0.3em;
                    border-bottom: 1px solid @border-light;
                }
            }
        }

        .right-options {
            height: 100%;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: end;
            align-items: center;

            &.blur {
                filter: blur(4px);
            }
        }
    }

    .send {
        padding: 0 0.5rem !important; // override .primary

        @media @mobile {
            display: none !important;
        }
    }

    .send-mobile {
        display: none;

        @media @mobile {
            display: flex;
        }
    }

    .entry-container {
        .flex-center();
        padding: 1rem;

        textarea {
            width: min(100%, 700px);
            max-width: 100%;
            min-width: 200px;
            resize: both;
            padding: 1rem;
            margin: 0;

            // fills page
            height: calc(100vh - 12rem);

            @media @mobile {
                // annoying on mobile to resize horizontally
                resize: vertical;

                // puts submit button at bottom of screen nicely
                height: calc(100vh - 19rem);
                width: calc(100% - 0.8em);
                overflow-y: scroll;
                margin: 0;
                background: none;
            }

            outline: none;
            border: none;
            font-size: 20px;
            background: @light-v-accent;
            border-radius: 8px;
        }

        @media @mobile {
            padding: 0;
        }
    }
</style>
