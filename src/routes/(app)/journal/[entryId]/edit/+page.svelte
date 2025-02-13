<script lang="ts">
    import UtcTime from '$lib/components/ui/UtcTime.svelte';
    import type { PageData } from './$types';
    import Close from 'svelte-material-icons/Close.svelte';
    import { obfuscated } from '$lib/stores';
    import EntryForm from '$lib/components/entryForm/EntryForm.svelte';

    export let data: PageData;
</script>

<svelte:head>
    <title>Edit Entry</title>
</svelte:head>

<main class="pt-4 md:p-4 md:pl-4 flex-center">
    <div class="w-full max-w-3xl bg-vLightAccent pt-2 px-2 rounded-xl">
        <div class="flex items-center justify-between pb-2 pr-1">
            <div class="flex items-center gap-2">
                <a href="/journal/{data.entry.id}">
                    <Close size="30" />
                </a>
                <UtcTime
                    timestamp={data.entry.created}
                    tzOffset={data.entry.createdTzOffset}
                    fmt="ddd, Do MMMM YYYY"
                />
            </div>
            <div> </div>
            <div> <i>editing</i><i class="hide-mobile">, changes saved locally</i> </div>
        </div>
        <EntryForm
            action="edit"
            entry={data.entry}
            newEntryBody={data.entry.body}
            newEntryLabelId={data.entry?.labelId || ''}
            newEntryTitle={data.entry.title}
            obfuscated={$obfuscated}
            labels={data.labels}
        />
    </div>
</main>
