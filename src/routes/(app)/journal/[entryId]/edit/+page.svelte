<script lang="ts">
    import type { PageData } from './$types';
    import Close from 'svelte-material-icons/Close.svelte';
    import { navExpanded, obfuscated } from '$lib/stores';
    import EntryForm from '$lib/components/entryForm/EntryForm.svelte';

    export let data: PageData;
    let { entry } = data;
</script>

<svelte:head>
    <title>Edit Entry</title>
</svelte:head>

<main class="pt-4 md:p-4 {$navExpanded ? 'md:ml-48' : 'md:ml-16'} flex-center">
    <div class="w-full max-w-3xl">
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
            newEntryBody={entry.body}
            newEntryLabel={entry?.label?.id || ''}
            newEntryTitle={entry.title}
            obfuscated={$obfuscated}
        />
    </div>
</main>

<style lang="scss">
    @import '$lib/styles/layout';

    .header {
        @extend .flex-center;
        justify-content: space-between;
    }
</style>
