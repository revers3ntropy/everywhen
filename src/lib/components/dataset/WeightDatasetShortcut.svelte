<script lang="ts">
    import { slide } from 'svelte/transition';
    import type { Auth } from '$lib/controllers/user/user';
    import type { Dataset } from '$lib/controllers/dataset/dataset';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { notify } from '$lib/components/notifications/notifications';

    export let auth: Auth;
    export let dataset: Dataset | null;

    function submit() {
        if (!value || value < 0 || typeof value !== 'number') {
            showInvalidMsg = true;
            return;
        }

        showInvalidMsg = false;
        value = '' as unknown as number;
        notify.success('Weight entered');
    }

    function onKeyUp(evt: KeyboardEvent) {
        if (evt.key === 'Enter') {
            submit();
        }
    }

    let showInvalidMsg = false;
    let value: number;
</script>

{#if dataset}
    <div class="container">
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
            />
            kg
            <button on:click={submit} class="with-circled-icon no-text">
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
{/if}

<style lang="less">
    .container {
        width: fit-content;
        margin: 0 1rem;
        padding: 1rem;
    }

    input {
        width: 4rem;
    }
</style>
