<script lang="ts">
    import { browser } from '$app/environment';
    // @ts-ignore
    import { tooltip } from '@svelte-plugins/tooltips';
    import { filedrop, type FileDropOptions, type Files } from 'filedrop-svelte';
    import { createEventDispatcher, onMount } from 'svelte';
    import ImageArea from 'svelte-material-icons/ImageArea.svelte';
    import Send from 'svelte-material-icons/Send.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import { api } from '../../lib/api/apiQuery';
    import LabelSelect from '../../lib/components/LabelSelect.svelte';
    import { enabledLocation } from '../../lib/constants';
    import type { Auth } from '../../lib/controllers/user';
    import { displayNotifOnErr, getFileContents } from '../../lib/utils';
    import LocationToggle from './LocationToggle.svelte';

    type OptionalCoords = [ number, number ] | [ null, null ];

    const { addNotification } = getNotificationsContext();
    const dispatch = createEventDispatcher();

    let mounted = false;

    let newEntryTitle = '';
    let newEntryBody = '';
    let newEntryLabel = '';
    $: if (mounted && browser) localStorage.setItem('__misc_3_newEntryTitle', newEntryTitle);
    $: if (mounted && browser) localStorage.setItem('__misc_3_newEntryBody', newEntryBody);
    $: if (mounted && browser) localStorage.setItem('__misc_3_newEntryLabel', newEntryLabel);

    onMount(() => {
        newEntryTitle = localStorage.getItem('__misc_3_newEntryTitle') || '';
        newEntryBody = localStorage.getItem('__misc_3_newEntryBody') || '';
        newEntryLabel = localStorage.getItem('__misc_3_newEntryLabel') || '';
        mounted = true;
    });

    export let auth: Auth;

    export function reset () {
        newEntryTitle = '';
        newEntryBody = '';
        newEntryLabel = '';
    }

    async function getLocation (): Promise<OptionalCoords> {
        let currentLocation: OptionalCoords = [ null, null ];
        if ($enabledLocation) {
            currentLocation = await new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    pos => {
                        resolve([
                            pos.coords.latitude,
                            pos.coords.longitude,
                        ]);
                    },
                    err => {
                        addNotification({
                            text: `Cannot get location: ${err.message}`,
                            removeAfter: 8000,
                            type: 'error',
                            position: 'top-center',
                        });
                        resolve([ null, null ]);
                    },
                );
            });
        }
        return currentLocation;
    }

    async function submit () {
        const currentLocation = await getLocation();

        const res = displayNotifOnErr(addNotification,
            await api.post(auth, '/entries', {
                title: newEntryTitle,
                entry: newEntryBody,
                label: newEntryLabel,
                latitude: currentLocation[0],
                longitude: currentLocation[1],
            }),
        );

        if (res.id) {
            reset();
        } else {
            console.error(res);
            addNotification({
                text: `Cannot create entry: ${JSON.stringify(res)}`,
                position: 'top-center',
                type: 'error',
            });
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
                removeAfter: 4000,
                text: 'File could not be read, please try again',
                type: 'error',
                position: 'top-center',
            });
            return;
        }
        if (files.accepted.length !== 1) {
            addNotification({
                removeAfter: 4000,
                text: 'Please select exactly one file',
                type: 'error',
                position: 'top-center',
            });
            return;
        }
        const file = files.accepted[0];
        const content = displayNotifOnErr(addNotification,
            await getFileContents(file, 'b64'),
        );

        const { id } = displayNotifOnErr(addNotification,
            await api.post(auth, '/assets', {
                fileName: file.name,
                content,
            }),
        );

        newEntryBody += `![${file.name}](/api/assets/${id})`;
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

    onMount(async () => {
        await stopSpaceAndEnterBeingInterceptedByFileDrop();
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
        <button
            aria-label="Insert Image"
            on:click={triggerFileDrop}
            use:tooltip={{ content: 'Insert Image' }}
        >
            <ImageArea size="30" />
        </button>
        <LocationToggle />

        <LabelSelect {auth} bind:value={newEntryLabel} />
        <button
            aria-label="Submit Entry"
            class="send"
            on:click={submit}
        >
            <Send size="30" />
        </button>
    </div>
    <textarea
        bind:value={newEntryBody}
        class="entry"
        placeholder="Entry"
    ></textarea>

    <button class="send-mobile" on:click={submit}>
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
        padding: 0.4em;
        border-bottom: 1px solid @border-light;
        display: flex;
        align-items: center;
        justify-content: space-between;

        @media @mobile {
            display: block;
        }
    }

    .title {
        border: none;
        width: 55%;
        font-size: 20px;
        margin: 0 0 0 1em;

        @media @mobile {
            width: 100%;
            margin: 0.2em;
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

    input, textarea {
        z-index: 10;
    }
</style>
