<script lang="ts">
    import { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
    import { EntryFlags } from '$lib/controllers/entry';
    import { tooltip } from '@svelte-plugins/tooltips';
    import LocationToggle from '$lib/components/location/LocationToggle.svelte';
    import LabelSelect from '$lib/components/label/LabelSelect.svelte';
    import TextBoxOutline from 'svelte-material-icons/TextBoxOutline.svelte';
    import type { Entry, RawEntry } from '$lib/controllers/entry';
    import type { Label } from '$lib/controllers/label';
    import type { Auth } from '$lib/controllers/user';
    import { dispatch } from '$lib/dataChangeEvents';
    import { displayNotifOnErr, notify } from '$lib/components/notifications/notifications';
    import { enabledLocation } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { getLocation } from '$lib/utils/geolocation';
    import { errorLogger } from '$lib/utils/log';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import { serializedAgentData } from '$lib/utils/userAgent';
    import { onMount } from 'svelte';
    import Send from 'svelte-material-icons/Send.svelte';

    export let auth: Auth;
    export let obfuscated = true;

    export let setEntryFormMode = null as null | ((mode: EntryFormMode) => Promise<void>);

    function resetEntryForm() {
        entry.value = '';
    }

    async function submit() {
        const entryVal = entry.value;

        resetEntryForm();

        const currentLocation = $enabledLocation ? await getLocation() : [null, null];

        const body = {
            title: '',
            entry: entryVal,
            label,
            latitude: currentLocation[0],
            longitude: currentLocation[1],
            created: nowUtc(),
            agentData: serializedAgentData(),
            createdTZOffset: currentTzOffset()
        } as RawEntry;

        const res = displayNotifOnErr(await api.post(auth, '/entries', { ...body }));

        if (!res.id) {
            errorLogger.error(res);
            notify.error(`Failed to create entry`);
            return;
        }

        const newEntry = {
            ...body,
            id: res.id,
            decrypted: true,
            flags: EntryFlags.NONE
        } as Mutable<Entry>;

        if (body.label && labels) {
            newEntry.label = labels.find(l => l.id === body.label);
            if (!newEntry.label) {
                notify.error(`Failed to find label`);
                errorLogger.error(
                    `Failed to find label ${body.label} in ${JSON.stringify(labels)}`
                );
            }
        }
        await dispatch.create('entry', {
            entry: newEntry,
            entryMode: EntryFormMode.Bullet
        });
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
        labels = displayNotifOnErr(await api.get(auth, '/labels')).labels;
    });
</script>

<div class="wrapper">
    <div class="flex-center" style="justify-content: start; width: 100%; gap: 3px;">
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
        <LocationToggle tooltipPosition="right" />
    </div>
    <div class="line">
        <div class="entry-input">
            <LabelSelect {labels} {auth} condensed bind:value={label} />
            <input
                on:keyup={onInput}
                bind:this={entry}
                placeholder="Write a bullet... (Enter to submit)"
            />
        </div>
        <div class="flex-center" style="justify-content: end">
            <button class="primary with-icon" on:click={submit} style="padding: 2px 5px; margin: 0">
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
            margin: 1rem 0;

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
</style>
