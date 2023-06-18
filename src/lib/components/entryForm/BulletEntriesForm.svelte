<script lang="ts">
    import { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
    import LocationToggle from '$lib/components/entryForm/LocationToggle.svelte';
    import LabelSelect from '$lib/components/label/LabelSelect.svelte';
    import type { Entry, RawEntry } from '$lib/controllers/entry';
    import { Label } from '$lib/controllers/label';
    import type { Auth } from '$lib/controllers/user';
    import { dispatch } from '$lib/dataChangeEvents';
    import {
        displayNotifOnErr,
        notify
    } from '$lib/notifications/notifications';
    import { enabledLocation } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { getLocation } from '$lib/utils/geolocation';
    import { errorLogger } from '$lib/utils/log';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import { serializedAgentData } from '$lib/utils/userAgent';
    import { onMount } from 'svelte';
    import Send from 'svelte-material-icons/Send.svelte';
    import type { Mutable } from '../../../app';

    export let auth: Auth;
    export let obfuscated = true;

    let entry: HTMLInputElement;
    let label: string;
    let labels = null as Label[] | null;

    export function resetEntryForm() {
        entry.value = '';
    }

    async function submit() {
        const entryVal = entry.value;

        resetEntryForm();

        const currentLocation = $enabledLocation
            ? await getLocation()
            : [null, null];

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

        const res = displayNotifOnErr(
            await api.post(auth, '/entries', { ...body })
        );

        if (!res.id) {
            errorLogger.error(res);
            notify.error(`Failed to create entry`);
            return;
        }

        const newEntry = {
            ...body,
            id: res.id,
            deleted: false,
            decrypted: true
        } as Mutable<Entry>;

        if (body.label && labels) {
            const { val: label, err } = await Label.withIdFromListOrFetch(
                api,
                auth,
                body.label,
                labels
            );
            if (err) {
                errorLogger.error(err);
                notify.error('Label not found');
            }
            newEntry.label = label;
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

    onMount(async () => {
        labels = displayNotifOnErr(await api.get(auth, '/labels')).labels;
    });
</script>

<div class="wrapper">
    <div class="line">
        <div class="entry-input">
            <LabelSelect {labels} {auth} condensed bind:value={label} />
            <!-- svelte-ignore a11y-autofocus -->
            <input
                on:keyup={onInput}
                bind:this={entry}
                placeholder="New bullet... (Enter to submit)"
                autofocus
            />
        </div>
        <div class="hide-mobile">
            <LocationToggle size={20} tooltipPosition="left" />
        </div>
        <button
            class="primary with-icon"
            on:click={submit}
            style="padding: 2px 5px !important;"
        >
            Submit
            <Send size="26" />
        </button>
    </div>
</div>

<style lang="less">
    @import '../../../styles/variables';
    .wrapper {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;

        .line {
            width: 100%;
            max-width: 800px;
            display: grid;
            grid-template-columns: 1fr auto auto;
            place-items: center;
            margin: 1rem 0;

            @media @mobile {
                gap: 0.5rem;
                grid-template-columns: 1fr;
            }

            .entry-input {
                width: 100%;
                display: grid;
                place-items: center;
                grid-template-columns: auto 1fr;
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
