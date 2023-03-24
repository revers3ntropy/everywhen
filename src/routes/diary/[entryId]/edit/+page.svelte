<script lang="ts">
    import { onMount } from 'svelte';
    import Close from 'svelte-material-icons/Close.svelte';
    import type { Entry } from '../../../../lib/controllers/entry';
    import EntryForm from '../../EntryForm.svelte';

    export let data: App.PageData & {
        entry: Entry
    };

    onMount(() => document.title = `Edit Entry`);

</script>

<svelte:head>
    <title>Edit Entry</title>
    <meta content="Edit Entry" name="description" />
</svelte:head>

<main>
    <div class="header">
        <div>
            <a href="/diary/{data.entry.id}">
                <Close size="30" />
            </a>
        </div>
        <h1>Edit Entry</h1>
        <div></div>
    </div>
    <EntryForm
        action="edit"
        auth={data}
        entryId={data.entry.id}
        loadFromLS={false}
        newEntryBody={data.entry.entry}
        newEntryLabel={data.entry?.label?.id || ''}
        newEntryTitle={data.entry.title}
    />
</main>

<style lang="less">
    @import '../../../../styles/layout.less';

    .header {
        .flex-center();
        justify-content: space-between;
    }
</style>