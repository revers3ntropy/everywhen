<script lang="ts">
    import { ANIMATION_DURATION } from '$lib/constants';
    import { dispatch, listen } from '$lib/dataChangeEvents';
    import { numberAsSignedStr } from '$lib/utils/text';
    import { tooltip } from '@svelte-plugins/tooltips';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import ChevronUp from 'svelte-material-icons/ChevronUp.svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import Restore from 'svelte-material-icons/Restore.svelte';
    import TimelineClockOutline from 'svelte-material-icons/TimelineClockOutline.svelte';
    import TimelineOutline from 'svelte-material-icons/TimelineOutline.svelte';
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
    export let expanded = false;
    export let allowCollapseChange = true;

    let nameInput: HTMLInputElement;

    async function updateEvent(changes: {
        name?: string;
        start?: TimestampSecs;
        end?: TimestampSecs;
        label?: Label['id'];
    }) {
        notify.onErr(await api.put(apiPath('/events/?', event.id), changes));

        const label = changes.label ? labels[changes.label] || null : event.label;

        event = {
            ...event,
            name: changes.name || event.name,
            start: changes.start || event.start,
            end: changes.end || event.end,
            tzOffset: event.tzOffset,
            label
        };
        await dispatch.update('event', event);
    }

    const updateName = (async ({ target }) => {
        if (!target || !('value' in target) || typeof target.value !== 'string') {
            throw target;
        }
        await updateEvent({
            name: target.value
        });
    }) satisfies ChangeEventHandler<HTMLInputElement>;

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
            if (!expanded && allowCollapseChange) {
                expanded = true;
            }
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

    $: if ([obfuscated, nameInput]) selectIfSelected(selectNameId, event.id);
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
    <div class="event" transition:slide|local={{ axis: 'y', duration: 0 }}>
        <div class="header">
            <div class="flex-center">
                {#if !expanded}
                    <div
                        transition:slide|local={{
                            axis: 'x',
                            duration: ANIMATION_DURATION,
                            delay: 100
                        }}
                    >
                        <LabelSelect
                            on:change={updateLabel}
                            value={event.label?.id || ''}
                            {labels}
                            condensed
                        />
                    </div>
                {/if}
            </div>
            <div>
                {#if obfuscated}
                    <p class="event-name-inp obfuscated">
                        {event.name}
                    </p>
                {:else}
                    <input
                        bind:this={nameInput}
                        class="editable-text event-name-inp"
                        on:change={updateName}
                        placeholder="Event Name"
                        aria-label="Event Name"
                        value={event.name}
                    />
                {/if}
            </div>
            <div class="flex-center">
                {#key expanded}
                    {#if allowCollapseChange}
                        <button
                            on:click={() => (expanded = !expanded)}
                            class="icon-button"
                            use:tooltip={{
                                content: expanded ? 'Collapse' : 'Expand',
                                position: 'left'
                            }}
                            aria-label="Toggle event info"
                        >
                            {#if expanded}
                                <ChevronUp size="30" />
                            {:else}
                                <ChevronDown size="30" />
                            {/if}
                        </button>
                    {/if}
                {/key}
            </div>
        </div>

        {#if expanded}
            <div
                class="expanded-content"
                transition:slide|local={{
                    axis: 'y',
                    duration: ANIMATION_DURATION
                }}
            >
                <div class="top-row">
                    <div
                        class="flex-center"
                        transition:fly|local={{
                            y: -50,
                            duration: ANIMATION_DURATION,
                            delay: ANIMATION_DURATION / 2
                        }}
                    >
                        <LabelSelect
                            on:change={updateLabel}
                            value={event.label?.id || ''}
                            {labels}
                        />
                    </div>
                </div>
                <div class="from-to-menu">
                    {#if Event.isInstantEvent(event)}
                        <input
                            class="editable-text"
                            on:change={updateStartAndEnd}
                            placeholder="Start"
                            type="datetime-local"
                            value={fmtTimestampForInput(event.start, currentTzOffset())}
                        />
                    {:else}
                        <input
                            class="editable-text"
                            on:change={updateStart}
                            placeholder="Start"
                            type="datetime-local"
                            value={fmtTimestampForInput(event.start, currentTzOffset())}
                        />
                        to
                        <input
                            class="editable-text"
                            on:change={updateEnd}
                            placeholder="End"
                            type="datetime-local"
                            value={fmtTimestampForInput(event.end, currentTzOffset())}
                        />
                        <i>
                            ({fmtDuration(event.end - event.start)})
                        </i>
                    {/if}
                </div>
                <div>
                    {#if Event.isInstantEvent(event)}
                        <button
                            class="with-icon bordered icon-gradient-on-hover rounded-xl"
                            on:click={makeDurationEvent}
                        >
                            <TimelineOutline size="25" />
                            Make Duration Event
                        </button>
                    {:else}
                        <button
                            class="with-icon bordered icon-gradient-on-hover rounded-xl"
                            on:click={makeInstantEvent}
                        >
                            <TimelineClockOutline size="25" />
                            Make Instant Event
                        </button>
                    {/if}
                    <button class="with-icon bordered danger rounded-xl" on:click={deleteEvent}>
                        <Bin size="25" />
                        Delete
                    </button>
                </div>
                <div class="p-4 pb-0 italic text-textColorLight text-sm">
                    Created <UtcTime timestamp={event.created} relative />, GMT{numberAsSignedStr(
                        event.tzOffset
                    )}
                </div>
            </div>
        {/if}
    </div>
{/if}

<style lang="scss">
    @import '$lib/styles/layout';

    .event {
        .header {
            display: grid;
            grid-template-columns: auto 1fr auto;
            margin: 0 5px;

            .event-name-inp {
                font-size: 1.2rem;
                line-height: 1.8rem;
                display: block;
                width: 100%;
                padding: 0.25rem 0.5rem;
                border-radius: calc($border-radius / 2);
            }
        }

        .expanded-content {
            .top-row {
                display: flex;
                justify-content: space-between;
                align-items: center;

                margin: 0.5rem 0.8rem;

                @media #{$mobile} {
                    margin: 0.5rem 0;
                }
            }
        }

        .from-to-menu {
            display: block;
            margin: 0 0.5rem;

            input[type='datetime-local'] {
                margin: 0.5rem;
            }

            * {
                margin: 0 0.3em;
            }
        }
    }

    i {
        font-size: 0.9em;
        color: var(--text-color-light);
    }
</style>
