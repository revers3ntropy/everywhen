<script lang="ts">
    import type { PageData } from './$types';
    import Close from 'svelte-material-icons/Close.svelte';
    import { obfuscated } from '$lib/stores';
    import EntryForm from '$lib/components/entryForm/EntryForm.svelte';

    export let data: PageData;
</script>

<svelte:head>
    <title>Edit Entry</title>
</svelte:head>

<main>
    <div class="header">
        <div>
            <a href="/journal/{data.entry.id}?obfuscate=0">
                <Close size="30" />
            </a>
        </div>
        <h1> Edit Entry </h1>
        <div />
    </div>
    <EntryForm
        action="edit"
        auth={data.auth}
        entry={data.entry}
        loadFromLS={false}
        newEntryBody={data.entry.entry}
        newEntryLabel={data.entry?.label?.id || ''}
        newEntryTitle={data.entry.title}
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
