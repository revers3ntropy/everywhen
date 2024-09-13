<script lang="ts">
    import { ANIMATION_DURATION } from '$lib/constants';
    import { dispatch } from '$lib/dataChangeEvents';
    import LabelSelect from '$lib/components/label/LabelSelect.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import { popup } from '$lib/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { slide } from 'svelte/transition';

    export let id: string;
    export let color: string;
    export let name: string;
    export let reloadOnDelete = true;
    export let labels: Record<string, Label>;

    let changeLabelId: string;

    async function rmLabel() {
        notify.onErr(
            await api.delete(apiPath(`/labels/?`, id), {
                strategy: 'remove'
            })
        );
        if (reloadOnDelete) {
            location.reload();
            return;
        }
        await dispatch.delete('label', id);
        popup.set(null);
    }

    async function reassign() {
        notify.onErr(
            await api.delete(apiPath(`/labels/?`, id), {
                strategy: 'reassign',
                newLabelId: changeLabelId
            })
        );
        if (reloadOnDelete) {
            location.reload();
            return;
        }
        await dispatch.delete('label', id);
        popup.set(null);
    }

    function cancel() {
        popup.set(null);
    }

    function filter(label: Label) {
        return label.id !== id;
    }
</script>

<div>
    <div class="pb-4 flex items-center gap-2">
        <span class="rounded-full aspect-square w-5 h-5 flex" style="background-color: {color}" />
        <p class="text-xl"> Delete Label '{name}' </p>
    </div>
    <p> There are entries, edits or events with this label. </p>

    <div class="options" in:slide={{ duration: ANIMATION_DURATION }}>
        <div>
            <LabelSelect bind:value={changeLabelId} {filter} {labels} />
            <button on:click={reassign}>
                Give Different Label to Entries/Events with this Label
            </button>
        </div>

        <h2>OR</h2>

        <div>
            <button on:click={rmLabel}> Delete Label and Remove from Entries/Events </button>
        </div>

        <div class="cancel">
            <button on:click|self={cancel}> Cancel </button>
        </div>
    </div>
</div>

<style lang="scss">
    .options {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 2rem;

        & > div {
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--border-color);
            border-radius: $border-radius;
            padding: 0.6em;
            margin: 0.5em;

            button {
                border-radius: $border-radius;
                margin: 0.5rem;
                padding: 0.3rem;

                &:hover {
                    background: var(--accent-danger);
                }
            }

            &.cancel {
                border: none;

                button {
                    padding: 0.5rem;

                    &:hover {
                        background: var(--light-accent);
                    }
                }
            }
        }
    }

    button {
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
