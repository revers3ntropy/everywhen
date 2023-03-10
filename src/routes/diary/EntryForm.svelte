<script lang="ts">
    import { browser } from '$app/environment';
    import { filedrop, type FileDropOptions, type Files } from 'filedrop-svelte';
    import { createEventDispatcher, onMount } from 'svelte';
    import Geolocation from 'svelte-geolocation';
    import ImageArea from 'svelte-material-icons/ImageArea.svelte';
    import Send from 'svelte-material-icons/Send.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import { api } from '../../lib/api/apiQuery';
    import LabelSelect from '../../lib/components/LabelSelect.svelte';
    import { Label } from '../../lib/controllers/label';
    import { User } from '../../lib/controllers/user';
    import { displayNotifOnErr, getFileContents } from '../../lib/utils';

    const { addNotification } = getNotificationsContext();
    const dispatch = createEventDispatcher();

    let mounted = false;

    let newEntryTitle = '';
    let newEntryBody = '';
    let newEntryLabel = '';
    $: mounted && browser ? localStorage.setItem('__misc_3_newEntryTitle', newEntryTitle) : 0;
    $: mounted && browser ? localStorage.setItem('__misc_3_newEntryBody', newEntryBody) : 0;
    $: mounted && browser ? localStorage.setItem('__misc_3_newEntryLabel', newEntryLabel) : 0;

    onMount(() => {
        newEntryTitle = localStorage.getItem('__misc_3_newEntryTitle') || '';
        newEntryBody = localStorage.getItem('__misc_3_newEntryBody') || '';
        newEntryLabel = localStorage.getItem('__misc_3_newEntryLabel') || '';
        mounted = true;
    });

    export let auth: User;
    let currentLocation = [];

    let labels: Label[] = [];

    export function reset () {
        newEntryTitle = '';
        newEntryBody = '';
        newEntryLabel = '';
    }

    async function submit () {
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
                event.stopImmediatePropagation();
            }, true);
    }

    function triggerFileDrop () {
        // bit hacky... TODO make less hacky
        document.querySelector('.entry-file-drop > input').click();
    }

    onMount(async () => {
        const res = displayNotifOnErr(addNotification,
            await api.get(auth, `/labels`),
        );
        labels = res.labels;

        await stopSpaceAndEnterBeingInterceptedByFileDrop();
    });

</script>

<div
    class="container entry-file-drop"
    on:filedrop={onFileDrop}
    use:filedrop={fileOptions}
>
    {#if browser}
        <Geolocation
            getPosition="true"
            let:error
            let:notSupported
            bind:coords={currentLocation}
        >
            {#if notSupported}
                This browser does not support the Geolocation API.

                <!--
                    Error code '1' means the user has denied location
                    services, so don't show any error message
                -->
            {:else if error && error.code !== 1 }
                An error occurred fetching geolocation data: {error.code}
                {error.message}
            {/if}
        </Geolocation>
    {/if}

    <div class="head">
        <input
            bind:value={newEntryTitle}
            class="title"
            placeholder="Title"
        />
        <button on:click={triggerFileDrop}>
            <ImageArea size="30" />
        </button>
        <LabelSelect {auth} bind:value={newEntryLabel} />
        <button class="send" on:click={submit}>
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
