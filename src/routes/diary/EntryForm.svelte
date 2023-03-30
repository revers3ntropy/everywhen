<script lang="ts">
    import { browser } from '$app/environment';
    import { beforeNavigate } from '$app/navigation';
    // @ts-ignore
    import { tooltip } from '@svelte-plugins/tooltips';
    import { filedrop, type FileDropOptions, type Files } from 'filedrop-svelte';
    import { createEventDispatcher, onMount } from 'svelte';
    import ImageArea from 'svelte-material-icons/ImageArea.svelte';
    import Send from 'svelte-material-icons/Send.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import LabelSelect from '../../lib/components/LabelSelect.svelte';
    import { MAX_IMAGE_SIZE } from '../../lib/constants';
    import type { Entry } from '../../lib/controllers/entry';
    import type { Label } from '../../lib/controllers/label';
    import type { Auth } from '../../lib/controllers/user';
    import { enabledLocation } from '../../lib/stores.js';
    import { api, apiPath } from '../../lib/utils/apiRequest';
    import { getFileContents } from '../../lib/utils/files';
    import { getLocation } from '../../lib/utils/geolocation';
    import { displayNotifOnErr, ERR_NOTIFICATION } from '../../lib/utils/notifications';
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
            localStorage.setItem('__misc_3_newEntryTitle', newEntryTitle);
            localStorage.setItem('__misc_3_newEntryBody', newEntryBody);
            localStorage.setItem('__misc_3_newEntryLabel', newEntryLabel);
        }
    }

    onMount(() => {
        if (loadFromLS) {
            newEntryTitle = localStorage.getItem('__misc_3_newEntryTitle') || '';
            newEntryBody = localStorage.getItem('__misc_3_newEntryBody') || '';
            newEntryLabel = localStorage.getItem('__misc_3_newEntryLabel') || '';
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
    }

    let submitted = false;

    beforeNavigate(({ cancel }) => {
        saveToLS();

        if (!submitted && areUnsavedChanges()) {
            if (!confirm('You have unsaved changes, are you sure you want to leave?')) {
                cancel();
            }
        }
    });

    async function submit () {
        const currentLocation = $enabledLocation
            ? await getLocation(addNotification)
            : [ null, null ];

        const body = {
            title: newEntryTitle,
            entry: newEntryBody,
            label: newEntryLabel,
            latitude: currentLocation[0],
            longitude: currentLocation[1],
        };

        let res;
        switch (action) {
            case 'create':
                res = displayNotifOnErr(addNotification,
                    await api.post(auth, '/entries', body),
                );
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
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        if (res.id) {
            // make really sure it's saved before resetting
            reset();
        } else {
            console.error(res);
            addNotification({
                ...ERR_NOTIFICATION,
                text: `Cannot create entry: ${JSON.stringify(res)}`,
            });
        }

        dispatch('updated');

        if (entry) {
            submitted = true;
            location.assign(`/diary/${entry.id}`);
        }
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
        insertAtCursor(newEntryInputElement, `\n![${file.name}](/api/assets/${id})\n`);
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
        <input
            aria-label="Entry Title"
            bind:value={newEntryTitle}
            class="title"
            placeholder="Title"
        />
        <div class="right-options">
            <button
                aria-label="Insert Image"
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
                on:click={submit}
            >
                <Send size="30" />
            </button>
        </div>
    </div>
    <div class="entry-container">
        <textarea
            bind:this={newEntryInputElement}
            bind:value={newEntryBody}
            class="entry"
            placeholder="Entry"
        ></textarea>
    </div>

    <button
        aria-label="Submit Entry"
        class="send-mobile"
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
        display: flex;
        align-items: end;
        justify-content: space-between;

        @media @mobile {
            display: flex;
            flex-wrap: wrap;
            border: none;
        }

        .title {
            border: none;
            width: 55%;
            font-size: 20px;
            margin: 0 0 .2rem .3em;

            @media @mobile {
                width: 100%;
                margin: 0.2em;
                border-bottom: 1px solid @border-light;
            }
        }

        .right-options {
            height: 100%;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: end;
            align-items: center;
        }
    }

    .entry {
        border-radius: 0;
        outline: none;
        border: none;
        width: calc(100% - 2.4em);
        max-width: 1500px;
        height: 500px;
        font-size: 20px;
        padding: 1.2em;

        @media @mobile {
            width: calc(100% - .8em);
            overflow-y: scroll;
            padding: .4em;
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
        border-radius: 10px;
        margin: 0.5em;
        padding: 0.2em;

        @media @mobile {
            display: inline-block;
        }
    }

    .entry-container {
        padding: 1rem;

        textarea {
            width: 100%;
            max-width: 100%;
            resize: both;
            padding: 0;
            margin: 0;

            // fills page
            height: calc(100vh - 12rem);

            @media @mobile {
                // annoying on mobile to resize horizontally
                resize: vertical;

                // puts submit button at bottom of screen nicely
                height: calc(100vh - 19rem);
            }
        }
    }

</style>
