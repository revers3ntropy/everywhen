<script lang="ts">
    import Entries from '$lib/components/entry/Entries.svelte';
    import type { PageData } from './$types';

    export let data: PageData;
</script>

<svelte:head>
    <title>Deleted Entries</title>
</svelte:head>

<main class="md:p-4 md:pl-4">
    <div class="flex-center">
        <div style="width: min(100%, 732px)">
            <Entries
                options={{
                    deleted: true
                }}
                locations={data.locations}
                labels={data.labels}
            />
        </div>
    </div>
</main>
