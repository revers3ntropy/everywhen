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

<main class="pt-4 md:p-4 md:ml-[10.5rem] flex-center">
    <div class="w-full max-w-3xl">
        <div class="flex-center justify-between">
            <div>
                <a href="/journal/{data.entry.id}">
                    <Close size="30" />
                </a>
            </div>
            <h1> Edit Entry </h1>
            <div />
        </div>
        <EntryForm
            action="edit"
            entry={data.entry}
            newEntryBody={data.entry.body}
            newEntryLabel={data.entry?.label?.id || ''}
            newEntryTitle={data.entry.title}
            obfuscated={$obfuscated}
            labels={data.labels}
        />
    </div>
</main>
