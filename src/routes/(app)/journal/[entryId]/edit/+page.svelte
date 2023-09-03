<script lang="ts">
    import type { PageData } from './$types';
    import Close from 'svelte-material-icons/Close.svelte';
    import { obfuscated } from '$lib/stores';
    import EntryForm from '$lib/components/entryForm/EntryForm.svelte';

    export let data: PageData;

    let { entry } = data;
</script>

<svelte:head>
    <title>Edit Entry</title>
</svelte:head>

<main>
    <div class="header">
        <div>
            <a href="/journal/{entry.id}">
                <Close size="30" />
            </a>
        </div>
        <h1> Edit Entry </h1>
        <div />
    </div>
    <EntryForm
        action="edit"
        {entry}
        loadFromLS={false}
        newEntryBody={entry.body}
        newEntryLabel={entry?.label?.id || ''}
        newEntryTitle={entry.title}
        obfuscated={$obfuscated}
    />
</main>

<style lang="less">
    @import '../../../../../styles/layout.less';

    .header {
        .flex-center();
        justify-content: space-between;
    }
</style>
