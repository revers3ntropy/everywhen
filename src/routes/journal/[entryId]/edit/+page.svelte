<script lang="ts">
    import { onMount } from 'svelte';
    import Close from 'svelte-material-icons/Close.svelte';
    import type { Entry } from '../../../../lib/controllers/entry';
    import { obfuscated } from '../../../../lib/stores';
    import EntryForm from '../../EntryForm.svelte';

    export let data: App.PageData & {
        entry: Entry;
    };

    onMount(() => (document.title = `Edit Entry`));
</script>

<svelte:head>
    <title>Edit Entry</title>
    <meta content="Edit Entry" name="description" />
</svelte:head>

<main>
    <div class="header">
        <div>
            <a href="/journal/{data.entry.id}?obfuscate=0">
                <Close size="30" />
            </a>
        </div>
        <h1>Edit Entry</h1>
        <div />
    </div>
    <EntryForm
        action="edit"
        auth={data}
        entry={data.entry}
        loadFromLS={false}
        newEntryBody={data.entry.entry}
        newEntryLabel={data.entry?.label?.id || ''}
        newEntryTitle={data.entry.title}
        obfuscated={$obfuscated}
    />
</main>

<style lang="less">
    @import '../../../../styles/layout.less';

    .header {
        .flex-center();
        justify-content: space-between;
    }
</style>
