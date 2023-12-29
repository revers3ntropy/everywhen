<script lang="ts">
    import { slide } from 'svelte/transition';
    import type { Dataset } from '$lib/controllers/dataset/dataset';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { notify } from '$lib/components/notifications/notifications';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';

    export let dataset: Dataset | null;

    async function submit() {
        if (!dataset) return;
        if (submitting) return;
        if (!value || value < 0 || typeof value !== 'number') {
            showInvalidMsg = true;
            return;
        }

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

        showInvalidMsg = false;
        submitting = false;
        value = '' as unknown as number;
        notify.success('Weight entered');
    }

    function onKeyUp(evt: KeyboardEvent) {
        if (evt.key === 'Enter') {
            void submit();
        }
    }

    let submitting = false;
    let showInvalidMsg = false;
    let value: number;
</script>

{#if dataset}
    <div class="p-2 md:p-0 md:pb-4">
        <div class="container w-fit p-4">
            <div>
                <a href="/datasets/{dataset.id}">Weight</a>
            </div>
            <div class="flex-center" style="margin: 0.5rem 0; gap: 4px">
                <input
                    type="number"
                    class="num-no-arrows"
                    on:keyup={onKeyUp}
                    bind:value
                    min="0"
                    disabled={submitting}
                    aria-label="enter your weight"
                />
                kg
                <button
                    on:click={submit}
                    class="with-circled-icon no-text"
                    disabled={submitting}
                    aria-label="Submit Weight"
                >
                    <Plus size="25" />
                </button>
            </div>
            {#if showInvalidMsg}
                <div
                    class="text-warning"
                    transition:slide={{
                        duration: ANIMATION_DURATION,
                        axis: 'y'
                    }}
                >
                    Invalid weight
                </div>
            {/if}
        </div>
    </div>
{/if}

<style lang="scss">
    input {
        width: 4rem;
    }
</style>
