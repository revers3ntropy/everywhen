<script lang="ts">
    import { goto } from '$app/navigation';
    import { Button } from '$lib/components/ui/button';
    import { tryEncryptText } from '$lib/utils/encryption.client';
    import type { PageData } from './$types';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { listen } from '$lib/dataChangeEvents';
    import LabelOptions from '$lib/components/label/LabelLink.svelte';
    import { omit } from '$lib/utils';
    import { tryDecryptText } from '$lib/utils/encryption.client.js';

    export let data: PageData;

    $: labelsList = Object.values(data.labels).sort((l1, l2) =>
        tryDecryptText(l1.name).localeCompare(tryDecryptText(l2.name))
    );

    async function newLabel() {
        let name = tryEncryptText('New Label');
        let i = 0;
        while (labelsList.some(l => l.name === name)) {
            name = tryEncryptText(`New Label ${++i}`);
        }

        const { id } = notify.onErr(
            await api.post('/labels', {
                name,
                color: '#000'
            })
        );

        await goto(`/labels/${id}`);
    }

    listen.label.onDelete(id => {
        delete data.labels[id];
    });
</script>

<svelte:head>
    <title>Labels</title>
</svelte:head>

<main class="p-2 md:p-4 md:pl-4 flex-center">
    <div class="w-full md:max-w-3xl">
        <div class="flex justify-between items-end pb-2">
            <div>
                <h2>Labels</h2>
            </div>
            <div>
                <Button class="primary flex-center gap-1" on:click={newLabel}>
                    <Plus size="30" />
                    New Label
                </Button>
            </div>
        </div>

        <div class="w-full">
            {#if labelsList.length}
                <div class="md:border border-border md:rounded-xl overflow-hidden">
                    {#each labelsList as label, i}
                        <LabelOptions {...omit(label, 'created', 'editCount')} />
                        {#if i < labelsList.length - 1}
                            <hr />
                        {/if}
                    {/each}
                </div>
            {:else}
                <p class="text-light italic">No labels</p>
            {/if}
        </div>
    </div>
</main>
