<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Switch } from '$lib/components/ui/switch';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { dispatch, listen } from '$lib/dataChangeEvents';
    import { numberAsSignedStr } from '$lib/utils/text';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import Restore from 'svelte-material-icons/Restore.svelte';
    import type { ChangeEventHandler } from 'svelte/elements';
    import LabelSelect from '$lib/components/label/LabelSelect.svelte';
    import type { TimestampSecs } from '../../../types';
    import UtcTime from '../ui/UtcTime.svelte';
    import { Event } from '$lib/controllers/event/event';
    import type { Label } from '$lib/controllers/label/label';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import {
        currentTzOffset,
        fmtDuration,
        fmtTimestampForInput,
        parseTimestampFromInputUtc
    } from '$lib/utils/time';
    import { slide, fly } from 'svelte/transition';

    export let labels: Record<string, Label>;
    export let obfuscated = true;

    export let event: Event & { deleted?: boolean };
    export let selectNameId: string | null = null;

    let nameInput: HTMLInputElement;

    async function updateEvent(changes: {
        name?: string;
        start?: TimestampSecs;
        end?: TimestampSecs;
        label?: Label['id'];
    }) {
        notify.onErr(await api.put(apiPath('/events/?', event.id), changes));

        const label = changes.label ? labels[changes.label] || null : event.label;
        const oldEvent = { ...event };
        event = {
            ...event,
            name: changes.name || event.name,
            start: changes.start || event.start,
            end: changes.end || event.end,
            tzOffset: event.tzOffset,
            label
        };
        await dispatch.update('event', event, oldEvent);
    }

    const updateName = async (newName: string) => {
        await updateEvent({
            name: newName
        });
    };

    const updateStart = (async ({ target }) => {
        if (!target || !('value' in target) || typeof target.value !== 'string') {
            throw target;
        }
        await updateEvent({
            start: parseTimestampFromInputUtc(target.value)
        });
    }) satisfies ChangeEventHandler<HTMLInputElement>;

    const updateStartAndEnd = (async ({ target }) => {
        if (!target || !('value' in target) || typeof target.value !== 'string') {
            throw target;
        }
        await updateEvent({
            start: parseTimestampFromInputUtc(target.value),
            end: parseTimestampFromInputUtc(target.value)
        });
    }) satisfies ChangeEventHandler<HTMLInputElement>;

    const updateEnd = (async ({ target }) => {
        if (!target || !('value' in target) || typeof target.value !== 'string') {
            throw target;
        }
        await updateEvent({
            end: parseTimestampFromInputUtc(target.value)
        });
    }) satisfies ChangeEventHandler<HTMLInputElement>;

    async function deleteEvent() {
        event.deleted = true;
        notify.onErr(await api.delete(apiPath('/events/?', event.id)));
        await dispatch.delete('event', event.id);
    }

    async function restoreEvent() {
        const { id } = notify.onErr(
            await api.post(`/events`, {
                name: event.name,
                start: event.start,
                end: event.end,
                tzOffset: currentTzOffset(),
                created: event.created,
                labels: event.label?.id
            })
        );
        event = {
            ...event,
            id
        };
        delete event.deleted;
        await dispatch.create('event', event);
    }

    async function makeDurationEvent() {
        const newEnd = event.end + 60 * 60;
        event.end = newEnd;
        await updateEvent({
            end: newEnd
        });
    }

    async function makeInstantEvent() {
        event.end = event.start;
        await updateEvent({
            end: event.start
        });
    }

    async function updateLabel({ detail: { id } }: CustomEvent<{ id: string }>) {
        if (id === (event.label?.id || '')) return;
        if (!labels) return;

        event.label = labels[id] || null;
        await updateEvent({
            label: id
        });
    }

    function selectIfSelected(selectNameId: string | null, eventId: string): undefined {
        if (selectNameId !== eventId) return;
        obfuscated = false;
        if (nameInput) {
            nameInput.focus();
            nameInput.select();
        }
    }

    listen.label.onCreate(label => {
        labels = {
            ...labels,
            [label.id]: label
        };
    });
    listen.label.onUpdate(label => {
        labels = {
            ...labels,
            [label.id]: label
        };
    });
    listen.label.onDelete(id => {
        // TODO check this syntax will actually update Svelte thing
        delete labels[id];
    });

    listen.event.onUpdate(e => {
        if (e.id !== event.id) return;
        event = e;
    });
    listen.event.onDelete(id => {
        if (id !== event.id) return;
        event.deleted = true;
    });

    // weird hack to have extra dependencies,
    // so selectIfSelected will run when nameInput changes
    $: [obfuscated, nameInput, selectIfSelected(selectNameId, event.id)].toString();
</script>

{#if event.deleted}
    <div class="flex flex-row justify-around items-center">
        <div>
            <i>'{event.name}' has been deleted</i>
        </div>
        <button
            class="with-icon bordered rounded-xl"
            on:click={restoreEvent}
            aria-label="Restore Event"
        >
            <Restore />
            Undo Deletion
        </button>
    </div>
{:else}
    <div class="" transition:slide|local={{ axis: 'y', duration: 0 }}>
        <div class="flex items-center justify-between">
            {#if obfuscated}
                <p class=" obfuscated">
                    {event.name}
                </p>
            {:else}
                <Textbox value={event.name} onChange={updateName} label="Event Name" />
            {/if}
            <Button
                variant="outline"
                class="border-none danger bg-transparent"
                on:click={deleteEvent}
            >
                <Bin size="25" />
            </Button>
        </div>

        <div
            class=""
            transition:slide|local={{
                axis: 'y',
                duration: ANIMATION_DURATION
            }}
        >
            <div class="py-4">
                <div
                    transition:fly|local={{
                        y: -50,
                        duration: ANIMATION_DURATION,
                        delay: ANIMATION_DURATION / 2
                    }}
                >
                    <LabelSelect on:change={updateLabel} value={event.label?.id || ''} {labels} />
                </div>
            </div>
            <div class="block">
                {#if Event.isInstantEvent(event)}
                    <div class="flex gap-4 items-center">
                        <Switch on:click={makeDurationEvent} />
                        Has duration
                    </div>
                    <span class="border rounded-xl border-border p-2 hover:bg-vLightAccent">
                        <input
                            on:change={updateStartAndEnd}
                            placeholder="Start"
                            type="datetime-local"
                            class="my-4"
                            value={fmtTimestampForInput(event.start, event.tzOffset)}
                        />
                    </span>
                {:else}
                    <div class="flex gap-4 items-center">
                        <Switch on:click={makeInstantEvent} checked />
                        Has duration
                    </div>
                    <div>
                        <span class="border rounded-xl border-border p-2 hover:bg-vLightAccent">
                            <input
                                on:change={updateStart}
                                placeholder="Start"
                                type="datetime-local"
                                class="my-4"
                                value={fmtTimestampForInput(event.start, event.tzOffset)}
                            />
                        </span>
                        <span class="italic text-light"> to </span>
                        <span class="border rounded-xl border-border p-2 hover:bg-vLightAccent">
                            <input
                                on:change={updateEnd}
                                placeholder="End"
                                type="datetime-local"
                                class="my-4"
                                value={fmtTimestampForInput(event.end, event.tzOffset)}
                            />
                        </span>
                    </div>
                    <span class="italic text-light">
                        ({fmtDuration(event.end - event.start)})
                    </span>
                {/if}
            </div>
            <div class="pt-4 italic text-textColorLight text-sm">
                Created <UtcTime timestamp={event.created} relative />, GMT{numberAsSignedStr(
                    event.tzOffset
                )}
            </div>
        </div>
    </div>
{/if}
