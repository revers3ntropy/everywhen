<script lang="ts">
    import { ANIMATION_DURATION } from '$lib/constants';
    import { dispatch } from '$lib/dataChangeEvents';
    import { onMount } from 'svelte';
    import BookSpinner from '$lib/components/ui/BookSpinner.svelte';
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

    let entryCount = 0;
    let eventCount = 0;

    let loaded = false;
    let changeLabelId: string;

    async function reloadEntries() {
        loaded = false;

        const entriesRes = notify.onErr(await api.get(`/entries`, { labelId: id }));
        entryCount = entriesRes.totalEntries;

        const eventsRes = notify.onErr(await api.get(`/events`, { labelId: id }));
        eventCount = eventsRes.events.filter(e => e.label?.id === id).length;

        loaded = true;
    }

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
        popup.set(null);
        await dispatch.delete('label', id);
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
        popup.set(null);
        await dispatch.delete('label', id);
    }

    function cancel() {
        popup.set(null);
    }

    function filter(label: Label) {
        return label.id !== id;
    }

    onMount(reloadEntries);
</script>

<div>
    <div class="pb-4 flex items-center gap-2">
        <span class="rounded-full aspect-square w-5 h-5 flex" style="background-color: {color}" />
        <p class="text-xl"> Delete Label '{name}' </p>
    </div>
    <p>
        There are {entryCount} entries and {eventCount} events with this label.
    </p>

    {#if !loaded}
        <BookSpinner />
    {:else}
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
    {/if}
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
