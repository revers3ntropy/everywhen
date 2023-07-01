<script lang="ts">
    import { ANIMATION_DURATION } from '$lib/constants';
    import { dispatch, listen } from '$lib/dataChangeEvents';
    import { tooltip } from '@svelte-plugins/tooltips';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import ChevronUp from 'svelte-material-icons/ChevronUp.svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import Restore from 'svelte-material-icons/Restore.svelte';
    import TimelineClockOutline from 'svelte-material-icons/TimelineClockOutline.svelte';
    import TimelineOutline from 'svelte-material-icons/TimelineOutline.svelte';
    import type { ChangeEventHandler } from 'svelte/elements';
    import LabelSelect from '$lib/components/label/LabelSelect.svelte';
    import UtcTime from '../UtcTime.svelte';
    import { Event } from '$lib/controllers/event';
    import type { Label as LabelController } from '../../controllers/label';
    import type { Auth } from '$lib/controllers/user';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import { obfuscate } from '$lib/utils/text';
    import { fmtDuration, fmtTimestampForInput, parseTimestampFromInputUtc } from '$lib/utils/time';
    import { slide, fly } from 'svelte/transition';

    export let auth: Auth;
    export let labels: LabelController[];
    export let obfuscated = true;

    export let bordered = true;
    export let event: Event & { deleted?: boolean };
    export let selectNameId = '';
    export let expanded = false;
    export let allowCollapseChange = true;

    let nameInput: HTMLInputElement;

    async function updateEvent(changes: {
        name?: string;
        start?: TimestampSecs;
        end?: TimestampSecs;
        label?: LabelController['id'];
    }) {
        displayNotifOnErr(await api.put(auth, apiPath('/events/?', event.id), changes));

        const label = changes.label ? labels?.find(l => l.id === changes.label) : event.label;

        event = {
            ...{
                id: event.id,
                name: changes.name || event.name,
                start: changes.start || event.start,
                end: changes.end || event.end,
                created: event.created
            },
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
        displayNotifOnErr(await api.delete(auth, apiPath('/events/?', event.id)));
        await dispatch.delete('event', event.id);
    }

    async function restoreEvent() {
        const { id } = displayNotifOnErr(
            await api.post(auth, `/events`, {
                name: event.name,
                start: event.start,
                end: event.end,
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

        event.label = labels.find(l => l.id === id) || undefined;
        await updateEvent({
            label: id
        });
    }

    function selectIfSelected(selectNameId: string, eventId: string) {
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
        labels = [...labels, label];
    });
    listen.label.onUpdate(label => {
        labels = labels.map(l => (l.id === label.id ? label : l));
    });
    listen.label.onDelete(id => {
        labels = labels.filter(l => l.id !== id);
    });

    listen.event.onUpdate(e => {
        if (e.id !== event.id) return;
        event = e;
    });
    listen.event.onDelete(id => {
        if (id !== event.id) return;
        event.deleted = true;
    });

    $: selectIfSelected(selectNameId, event.id), obfuscated || nameInput;
</script>

{#if event.deleted}
    <div class="restore-event" class:invisible={!bordered}>
        <div>
            <i>'{event.name}' has been deleted</i>
        </div>
        <button class="with-icon bordered" on:click={restoreEvent}>
            <Restore />
            Undo Deletion
        </button>
    </div>
{:else}
    <div
        class="event"
        class:invisible={!bordered}
        transition:slide|local={{ axis: 'y', duration: 0 }}
    >
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
                            {auth}
                            condensed
                        />
                    </div>
                {/if}
            </div>
            <div>
                {#if obfuscated}
                    <p class="event-name-inp obfuscated">
                        {obfuscate(event.name)}
                    </p>
                {:else}
                    <input
                        bind:this={nameInput}
                        class="editable-text event-name-inp"
                        on:change={updateName}
                        placeholder="Event Name"
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
                            {auth}
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
                            value={fmtTimestampForInput(event.start)}
                        />
                    {:else}
                        <input
                            class="editable-text"
                            on:change={updateStart}
                            placeholder="Start"
                            type="datetime-local"
                            value={fmtTimestampForInput(event.start)}
                        />
                        to
                        <input
                            class="editable-text"
                            on:change={updateEnd}
                            placeholder="End"
                            type="datetime-local"
                            value={fmtTimestampForInput(event.end)}
                        />
                        <i>
                            ({fmtDuration(event.end - event.start)})
                        </i>
                    {/if}
                </div>
                <div>
                    {#if Event.isInstantEvent(event)}
                        <button
                            class="with-icon bordered icon-gradient-on-hover"
                            on:click={makeDurationEvent}
                        >
                            <TimelineOutline size="25" />
                            Make Duration Event
                        </button>
                    {:else}
                        <button
                            class="with-icon bordered icon-gradient-on-hover"
                            on:click={makeInstantEvent}
                        >
                            <TimelineClockOutline size="25" />
                            Make Instant Event
                        </button>
                    {/if}
                    <button class="with-icon bordered danger" on:click={deleteEvent}>
                        <Bin size="25" />
                        Delete
                    </button>
                </div>
                <div class="created-datetime">
                    <i>
                        Created
                        <!-- TODO use tz from db -->
                        <UtcTime timestamp={event.created} fmt="MMMM Do YYYY, h:mma" />
                        (<UtcTime timestamp={event.created} relative />)
                    </i>
                </div>
            </div>
        {/if}
    </div>
{/if}

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/layout';

    .restore-event {
        .container();
        border-radius: @border-radius;
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        align-items: center;
        margin: 8px;
        padding: 1.3rem 0.4rem;
    }

    .event {
        .container();
        margin: 8px;

        .created-datetime {
            padding: 0 1rem 1rem 1rem;
        }

        .header {
            display: grid;
            grid-template-columns: auto 1fr auto;
            margin: 0 5px;

            .event-name-inp {
                font-size: 1.4rem;
                display: block;
                width: 100%;
            }
        }

        @media @mobile {
            margin: 1rem 0;
            border-radius: 0;
            background: none;
            border-bottom: 1px solid var(--border-color);
        }

        .expanded-content {
            .top-row {
                display: flex;
                justify-content: space-between;
                align-items: center;

                margin: 0.5rem 0.8rem;

                @media @mobile {
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
