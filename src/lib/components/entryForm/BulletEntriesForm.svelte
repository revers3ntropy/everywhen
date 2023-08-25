<script lang="ts">
    import { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
    import { wordCount } from '$lib/utils/text';
    import { tooltip } from '@svelte-plugins/tooltips';
    import LocationToggle from '$lib/components/location/LocationToggle.svelte';
    import LabelSelect from '$lib/components/label/LabelSelect.svelte';
    import TextBoxOutline from 'svelte-material-icons/TextBoxOutline.svelte';
    import { Entry } from '$lib/controllers/entry/entry';
    import type { Label } from '$lib/controllers/label/label';
    import { dispatch, listen } from '$lib/dataChangeEvents';
    import { notify } from '$lib/components/notifications/notifications';
    import { currentlyUploadingEntries, enabledLocation } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { getLocation } from '$lib/utils/geolocation';
    import { clientLogger } from '$lib/utils/log';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import { serializedAgentData } from '$lib/utils/userAgent';
    import { onMount } from 'svelte';
    import Send from 'svelte-material-icons/Send.svelte';

    export let obfuscated = true;
    export let setEntryFormMode = null as null | ((mode: EntryFormMode) => Promise<void>);
    export let showLocationToggle = true;
    export let submitIsPrimaryButton = true;

    async function submit() {
        currentlyUploadingEntries.update(v => v + 1);

        const entryVal = entry.value;
        entry.value = '';

        const agentData = serializedAgentData();
        const createdTZOffset = currentTzOffset();

        entry?.focus();

        const currentLocation = $enabledLocation ? await getLocation() : [null, null];

        const body = {
            title: '',
            entry: entryVal,
            label,
            latitude: currentLocation[0],
            longitude: currentLocation[1],
            created: nowUtc(),
            agentData,
            createdTZOffset,
            wordCount: wordCount(entryVal)
        };

        const res = notify.onErr(await api.post('/entries', { ...body }));

        if (!res.id) {
            clientLogger.error(res);
            notify.error(`Failed to create entry`);
            return;
        }

        const newEntry: Mutable<Entry> = {
            ...body,
            id: res.id,
            flags: Entry.Flags.NONE,
            edits: [],
            label: null
        };

        if (body.label && labels) {
            newEntry.label = labels.find(l => l.id === body.label) ?? null;
            if (!newEntry.label) {
                notify.error(`Failed to find label`);
                clientLogger.error(
                    `Failed to find label ${body.label} in ${JSON.stringify(labels)}`
                );
            }
        }

        await dispatch.create('entry', {
            entry: newEntry,
            entryMode: EntryFormMode.Bullet
        });

        entry?.focus();
        currentlyUploadingEntries.update(v => v - 1);
    }

    function onInput(e: KeyboardEvent) {
        // check for Enter
        if (e.key === 'Enter') {
            void submit();
        }
    }

    let entry: HTMLInputElement;
    let label: string;
    let labels = null as Label[] | null;

    onMount(async () => {
        labels = notify.onErr(await api.get('/labels')).labels;
    });

    listen.label.onCreate(label => {
        labels = [...(labels || []), label];
    });
    listen.label.onUpdate(label => {
        if (labels === null) {
            clientLogger.error('labels should not be null');
            return;
        }
        labels = labels.map(l => (l.id === label.id ? label : l));
    });
    listen.label.onDelete(id => {
        if (labels === null) {
            clientLogger.error('labels should not be null');
            return;
        }
        labels = labels.filter(l => l.id !== id);
    });
</script>

<div class="wrapper">
    {#if setEntryFormMode || showLocationToggle}
        <div
            class="flex-center"
            style="justify-content: start; width: 100%; gap: 3px; margin: 0 0 1rem 0"
        >
            {#if setEntryFormMode}
                <button
                    aria-label="Switch to bullet journaling"
                    class="with-circled-icon"
                    on:click={() => setEntryFormMode?.(EntryFormMode.Standard)}
                    style="margin: 0"
                    use:tooltip={{
                        position: 'right',
                        content: 'Switch to normal journaling'
                    }}
                >
                    <TextBoxOutline size="30" />
                </button>
            {/if}
            {#if showLocationToggle}
                <LocationToggle tooltipPosition="right" />
            {/if}
        </div>
    {/if}
    <div class="line">
        <div class="entry-input">
            <LabelSelect {labels} condensed bind:value={label} />
            <input on:keyup={onInput} bind:this={entry} placeholder="Write a bullet..." />
        </div>
        <div class="flex-center" style="justify-content: end">
            <button
                class="submit-button with-icon icon-gradient-on-hover"
                class:primary={submitIsPrimaryButton}
                on:click={submit}
                style="padding: 2px 5px; margin: 0"
            >
                Submit
                <Send size="26" />
            </button>
        </div>
    </div>
</div>

<style lang="less">
    @import '../../../styles/variables';

    .wrapper {
        margin: 1rem 1rem;
        width: calc(100% - 2rem);

        @media @mobile {
            margin: 1rem 0;
            width: 100%;
        }

        .line {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr auto;
            margin: 0;

            @media @mobile {
                gap: 0.5rem;
                grid-template-columns: 1fr;
            }

            .entry-input {
                display: flex;

                input {
                    border-radius: @border-radius;
                    border: 1px solid transparent;
                    margin-right: 4px;
                    &:hover {
                        border: 1px solid var(--border-color);
                    }
                    &:focus {
                        background: var(--light-accent);
                        border: 1px solid transparent;
                    }
                }
            }

            .bullet {
                display: inline-block;
                width: 0.5em;
                height: 0.5em;
                border-radius: 50%;
                background-color: var(--light-accent);
                margin-right: 0.5em;
            }

            input {
                width: 100%;
                font-size: 18px;
            }
        }
    }

    .submit-button {
        border-radius: @border-radius;
        &:hover {
            background: var(--light-accent);
        }
    }
</style>
