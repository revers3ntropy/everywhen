<script lang="ts">
    import { browser } from '$app/environment';
    import { beforeNavigate } from '$app/navigation';
    // @ts-ignore
    import { tooltip } from '@svelte-plugins/tooltips';
    import { filedrop, type FileDropOptions, type Files } from 'filedrop-svelte';
    import { createEventDispatcher, onMount } from 'svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import ImageArea from 'svelte-material-icons/ImageArea.svelte';
    import Send from 'svelte-material-icons/Send.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import LabelSelect from '../../lib/components/LabelSelect.svelte';
    import { LS_KEY, MAX_IMAGE_SIZE } from '../../lib/constants';
    import { Asset } from '../../lib/controllers/asset';
    import type { Entry } from '../../lib/controllers/entry';
    import type { Label } from '../../lib/controllers/label';
    import type { Auth } from '../../lib/controllers/user';
    import { enabledLocation } from '../../lib/stores.js';
    import { api, apiPath } from '../../lib/utils/apiRequest';
    import { getFileContents } from '../../lib/utils/files';
    import { getLocation } from '../../lib/utils/geolocation';
    import { displayNotifOnErr, ERR_NOTIFICATION, SUCCESS_NOTIFICATION } from '../../lib/utils/notifications';
    import { obfuscate } from '../../lib/utils/text';
    import { nowS } from '../../lib/utils/time';
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

    export function reset () {
        newEntryTitle = '';
        newEntryBody = '';
        newEntryLabel = '';
    }

    $: if (mounted && browser && loadFromLS) {
        // be reactive on these
        [ newEntryTitle, newEntryBody, newEntryLabel ];
        saveToLS();
    }

    function saveToLS () {
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
        } else {
            obfuscated = true;
        }
        mounted = true;
    });

    function areUnsavedChanges () {
        if (entry && !loadFromLS) {
            // check for unsaved changes
            if (entry.title !== newEntryTitle
                || entry.entry !== newEntryBody
                || ((entry.label?.id || '') !== newEntryLabel)
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * @src https://stackoverflow.com/questions/11076975
     */
    function insertAtCursor (input: HTMLInputElement | HTMLTextAreaElement, text: string) {
        // IE support
        if ((document as any).selection) {
            input.focus();
            const sel = (document as any).selection.createRange();
            sel.text = text;
        }
        // MOZILLA and others
        else if (input.selectionStart || input.selectionStart === 0) {
            const startPos = input.selectionStart ?? undefined;
            const endPos = input.selectionEnd ?? 0;
            input.value = input.value.substring(0, startPos)
                + text
                + input.value.substring(endPos, input.value.length);
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
            if (!confirm('You have unsaved changes, are you sure you want to leave?')) {
                cancel();
            }
        }
    });

    async function submit () {
        submitted = true;

        const currentLocation = $enabledLocation
            ? await getLocation(addNotification)
            : [ null, null ];

        const body = {
            title: newEntryTitle,
            entry: newEntryBody,
            label: newEntryLabel,
            latitude: currentLocation[0],
            longitude: currentLocation[1],
            created: nowS(),
        };

        let res;
        switch (action) {
            case 'create':
                res = displayNotifOnErr(addNotification,
                    await api.post(auth, '/entries', body),
                );
                submitted = false;
                if (res.id) {
                    // make really sure it's saved before resetting
                    reset();
                } else {
                    console.error(res);
                    addNotification({
                        ...ERR_NOTIFICATION,
                        text: `Failed to create entry: ${JSON.stringify(res)}`,
                    });
                }
                addNotification({
                    ...SUCCESS_NOTIFICATION,
                    removeAfter: 1000,
                    text: `Entry created!`,
                });
                break;
            case 'edit':
                if (!entry) throw new Error('entry must be set when action is edit');
                if (!areUnsavedChanges()) {
                    if (!confirm('No changes have been made, are you sure you want to edit this entry?')) {
                        return;
                    }
                }
                res = displayNotifOnErr(addNotification,
                    await api.put(auth, apiPath('/entries/?', entry.id), body),
                );
                location.assign(`/journal/${entry.id}?obfuscate=0`);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
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
        id: 'entry-file-drop',
    };

    async function onFileDrop (e: CustomEvent<{ files: Files }>) {
        const files = e.detail.files;
        if (files.rejected.length > 0) {
            addNotification({
                ...ERR_NOTIFICATION,
                text: 'File could not be read, please try again',
            });
            return;
        }
        if (files.accepted.length < 1) return;
        if (files.accepted.length !== 1) {
            addNotification({
                ...ERR_NOTIFICATION,
                text: 'Please select exactly one file',
            });
            return;
        }
        const file = files.accepted[0];
        const content = displayNotifOnErr(addNotification,
            await getFileContents(file, 'b64'),
        );

        if (!content) return;
        if (content.length > MAX_IMAGE_SIZE) {
            addNotification({
                ...ERR_NOTIFICATION,
                text: 'File too large',
            });
            return;
        }

        const { id } = displayNotifOnErr(addNotification,
            await api.post(auth, '/assets', {
                fileName: file.name,
                content,
            }),
        );

        // insert markdown to link to image
        insertAtCursor(newEntryInputElement, `\n${Asset.markDownLink(file.name, id)}\n`);
    }

    async function stopSpaceAndEnterBeingInterceptedByFileDrop () {
        // TODO do this properly
        while (!document.getElementsByClassName('entry-file-drop')) {
            await new Promise(r => setTimeout(r, 100));
        }
        // https://stackoverflow.com/questions/19469881
        document.getElementsByClassName('entry-file-drop')[0]
            .addEventListener('keydown', event => {
                // same check as lib uses
                // @ts-ignore
                if (event.key === ' ' || event.key === 'Enter') {
                    event.stopImmediatePropagation();
                }
            }, true);
    }

    function triggerFileDrop () {
        // bit hacky... TODO make less hacky
        // @ts-ignore
        document.querySelector('.entry-file-drop > input').click();
    }

    let labels: Label[] | null = null;

    async function loadLabels () {
        const labelsRes = displayNotifOnErr(addNotification,
            await api.get(auth, '/labels'),
        );
        labels = labelsRes.labels;
    }

    onMount(async () => {
        await Promise.all([
            loadLabels(),
            stopSpaceAndEnterBeingInterceptedByFileDrop(),
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
                on:click={() => obfuscated = !obfuscated}
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
                use:tooltip={{ content: 'Insert Image' }}
            >
                <ImageArea size="30" />
            </button>
            <LocationToggle />

            <LabelSelect
                {auth}
                bind:value={newEntryLabel}
                {labels}
            />

            <button
                aria-label="Submit Entry"
                class="send icon-button"
                disabled={submitted}
                on:click={submit}
            >
                <Send size="30" />
            </button>
        </div>
    </div>
    <div class="entry-container">
        {#if obfuscated}
            <textarea
                placeholder="..."
                disabled
                class="obfuscated"
            >{obfuscate(newEntryBody)}</textarea>
        {:else}
            <textarea
                bind:this={newEntryInputElement}
                bind:value={newEntryBody}
                placeholder="Entry"
                disabled={submitted}
            ></textarea>
        {/if}
    </div>

    <button
        aria-label="Submit Entry"
        class="send-mobile"
        disabled={submitted}
        on:click={submit}
    >
        <Send size="30" />
    </button>
</div>

<style lang="less">
    @import '../../styles/variables.less';
    @import '../../styles/layout.less';

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
        grid-template-columns: 1fr 23.5rem;

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
                margin: 0 0 .2rem .3em;

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
        margin: 0 0 0 .2rem;
        padding: .4rem;
        @media @mobile {
            display: none;
        }
    }

    .send-mobile {
        .flex-center();

        display: none;
        width: calc(100% - 1em);
        border: 1px solid @border;
        border-radius: @border-radius;
        margin: 0.5em;
        padding: 0.2em;

        @media @mobile {
            display: inline-block;
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
                width: calc(100% - .8em);
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
