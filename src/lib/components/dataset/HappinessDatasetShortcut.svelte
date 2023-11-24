<script lang="ts">
    import type { Dataset } from '$lib/controllers/dataset/dataset';
    import { notify } from '$lib/components/notifications/notifications';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';

    export let dataset: Dataset | null;
    async function submit(value: number) {
        if (!dataset) return;
        if (submitting) return;

        submitting = true;

        notify.onErr(
            await api.post(apiPath('/datasets/?', dataset.id), {
                rows: [
                    {
                        elements: [value],
                        created: nowUtc(),
                        timestamp: nowUtc(),
                        timestampTzOffset: currentTzOffset()
                    }
                ]
            })
        );

        submitting = false;
        value = '' as unknown as number;
        notify.success('Happiness entered');
    }

    let submitting = false;
</script>

{#if dataset}
    <div class="container">
        <div class="flex-center gap-2">
            <button on:click={() => submit(0)}>Sad</button>
            <button on:click={() => submit(0.5)}>Meh</button>
            <button on:click={() => submit(1)}>Happy</button>
        </div>
    </div>
{/if}

<style lang="scss">
    .container {
        width: fit-content;
        padding: 1rem;
    }

    input {
        width: 4rem;
    }
</style>
