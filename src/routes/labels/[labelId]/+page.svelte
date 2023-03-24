<script lang="ts">
    import { onMount } from 'svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import Entries from '../../../lib/components/Entries.svelte';
    import type { Label } from '../../../lib/controllers/label';
    import { api, apiPath } from '../../../lib/utils/apiRequest';
    import { displayNotifOnErr } from '../../../lib/utils/notifications';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData & {
        label: Label,
        entryCount: number
    };

    async function updateName () {
        displayNotifOnErr(addNotification,
            await api.put(data, apiPath('/labels/?', data.label.id), {
                name: data.label.name,
            }),
        );
    }

    async function updateColour () {
        displayNotifOnErr(addNotification,
            await api.put(data, apiPath('/labels/?', data.label.id), {
                colour: data.label.colour,
            }),
        );
    }

    onMount(() => document.title = `${data.label.name} - Label`);

</script>

<svelte:head>
    <title>{data.label.name} - Label</title>
    <meta content="Label" name="description" />
</svelte:head>

<main>
    <div class="colour-select" style="border-color: {data.label.colour}">
        {data.label.colour}
        <input
            type="color"
            bind:value={data.label.colour}
            on:change={updateColour}
        >
    </div>
    <input
        class="name editable-text"
        bind:value={data.label.name}
        on:change={updateName}
    >

    <p>
        Has {data.entryCount} {data.entryCount === 1 ? "entry" : "entries"}
    </p>

    <Entries
        auth={data}
        options={{ labelId: data.label.id }}
        showLabels={false}
        pageSize={data.settings.entriesPerPage.value}
    />
</main>

<style lang="less">
    .name {
        font-size: 2em;
        font-weight: bold;
    }

    .colour-select {
        width: calc(100% - 1em);
        border: none;
        border-bottom: 3px solid black;
        font-size: 1em;
        font-weight: bold;
        padding: 0.4em;
        margin: 0.4em 0;
    }
</style>
