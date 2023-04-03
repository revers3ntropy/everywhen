<script lang="ts">
    import { browser } from '$app/environment';
    // @ts-ignore
    import { tooltip } from '@svelte-plugins/tooltips';
    import { createEventDispatcher, onMount } from 'svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import Pencil from 'svelte-material-icons/Pencil.svelte';
    import PencilOff from 'svelte-material-icons/PencilOff.svelte';
    import Restore from 'svelte-material-icons/Restore.svelte';
    import TimelineClockOutline from 'svelte-material-icons/TimelineClockOutline.svelte';
    import TimelineOutline from 'svelte-material-icons/TimelineOutline.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { ChangeEventHandler } from 'svelte/elements';
    import Label from '../../lib/components/Label.svelte';
    import LabelSelect from '../../lib/components/LabelSelect.svelte';
    import UtcTime from '../../lib/components/UtcTime.svelte';
    import type { Event as EventController } from '../../lib/controllers/event';
    import { Event } from '../../lib/controllers/event';
    import type { Label as LabelController } from '../../lib/controllers/label';
    import type { Auth } from '../../lib/controllers/user';
    import { api, apiPath } from '../../lib/utils/apiRequest';
    import { displayNotifOnErr } from '../../lib/utils/notifications';
    import { obfuscate } from '../../lib/utils/text';
    import { fmtDuration, fmtTimestampForInput, parseTimestampFromInputUtc } from '../../lib/utils/time';
    import type { Seconds } from '../../lib/utils/types';

    const { addNotification } = getNotificationsContext();
    const dispatch = createEventDispatcher();

    export let auth: Auth;
    export let obfuscated = true;
    export let event: EventController & { deleted?: true };
    export let selectNameId = '';
    export let changeEventCount: (by: number) => void;
    export let editingLabel = false;

    let nameInput: HTMLInputElement;
    export let labels: LabelController[];

    let panelOpen = false;

    async function updateEvent (
        changes: {
            name?: string;
            start?: Seconds;
            end?: Seconds;
            label?: LabelController['id'];
        },
    ) {
        displayNotifOnErr(addNotification,
            await api.put(auth, apiPath('/events/?', event.id), changes),
        );
        dispatch('update');
    }

    const updateName = (async ({ target }) => {
        if (!target || !('value' in target) || typeof target.value !== 'string') {
            throw target;
        }
        await updateEvent({
            name: target.value,
        });
    }) satisfies ChangeEventHandler<HTMLInputElement>;

    const updateStart = (async ({ target }) => {
        if (!target || !('value' in target) || typeof target.value !== 'string') {
            throw target;
        }
        await updateEvent({
            start: parseTimestampFromInputUtc(target.value),
        });
    }) satisfies ChangeEventHandler<HTMLInputElement>;

    const updateStartAndEnd = (async ({ target }) => {
        if (!target || !('value' in target) || typeof target.value !== 'string') {
            throw target;
        }
        await updateEvent({
            start: parseTimestampFromInputUtc(target.value),
            end: parseTimestampFromInputUtc(target.value),
        });
    }) satisfies ChangeEventHandler<HTMLInputElement>;

    const updateEnd = (async ({ target }) => {
        if (!target || !('value' in target) || typeof target.value !== 'string') {
            throw target;
        }
        await updateEvent({
            end: parseTimestampFromInputUtc(target.value),
        });
    }) satisfies ChangeEventHandler<HTMLInputElement>;

    async function deleteEvent () {
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }
        changeEventCount(-1);
        displayNotifOnErr(addNotification,
            await api.delete(auth, apiPath('/events/?', event.id)),
        );
        dispatch('delete', event);
    }

    async function restoreEvent () {
        changeEventCount(1);
        const { id } = displayNotifOnErr(addNotification,
            await api.post(auth, `/events`, {
                name: event.name,
                start: event.start,
                end: event.end,
                created: event.created,
                labels: event.label?.id,
            }),
        );
        event.id = id;
        dispatch('update');
    }

    async function makeDurationEvent () {
        const newEnd = event.end + 60 * 60;
        event.end = newEnd;
        await updateEvent({
            end: newEnd,
        });
    }

    async function makeInstantEvent () {
        event.end = event.start;
        await updateEvent({
            end: event.start,
        });
    }

    async function updateLabel (
        { detail: { id } }: CustomEvent<{ id: string }>,
    ) {
        if (id === (event.label?.id || '')) return;
        if (!labels) return;

        event.label = labels.find(l => l.id === id) || undefined;
        await updateEvent({
            label: id,
        });
    }

    onMount(async () => {
        if (selectNameId === event.id) {
            nameInput.focus();
            nameInput.select();
        }
    });

    $: if (browser && selectNameId === event.id && nameInput) {
        nameInput.focus();
    }
</script>

<div class="event {panelOpen ? 'open' : ''}">
    {#if event.deleted}
        <div class="restore-menu">
            <i>'{event.name}' has been deleted</i>
            <button
                class="primary unbordered"
                on:click={restoreEvent}
            >
                <Restore />
                Undo Deletion
            </button>
        </div>
    {:else}
        {#if panelOpen}
            <div class="header">
                <button
                    aria-label={obfuscated ? 'Show entry' : 'Hide entry'}
                    on:click={() => obfuscated = !obfuscated}
                >
                    {#if obfuscated}
                        <Eye size="25" />
                    {:else}
                        <EyeOff size="25" />
                    {/if}
                </button>
                {#if !obfuscated}
                    <i>
                        Created
                        <!-- TODO use tz from db -->
                        <UtcTime
                            timestamp={event.created}
                            fmt="hh:mm DD/MM/YYYY"
                        />
                    </i>
                    {#if editingLabel}
                        <div class="flex-center">
                            <LabelSelect
                                on:change={updateLabel}
                                value={event.label?.id || ''}
                                {labels}
                                {auth}
                            />
                            <button
                                on:click={() => editingLabel = false}
                                class="icon-button"
                            >
                                <PencilOff size="20" />
                            </button>
                        </div>
                    {:else}
                        {#if event.label}
                            <span>
                                <Label
                                    {obfuscated}
                                    label={event.label}
                                />
                                <button
                                    on:click={() => editingLabel = true}
                                >
                                    <Pencil size="15" />
                                </button>
                            </span>
                        {:else}
                            <button
                                class="link"
                                on:click={() => editingLabel = true}
                            >
                                Add Label
                            </button>
                        {/if}
                    {/if}
                    <button
                        class="danger"
                        on:click={deleteEvent}
                    >
                        <Bin size="25" />
                    </button>
                {/if}
                <button on:click={() => panelOpen = false}>
                    close
                </button>
            </div>
            <div class="middle-row">
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
                    >
                {/if}
                <p>
                    {#if !Event.isInstantEvent(event)}
                        <i>
                            ({fmtDuration(event.end - event.start)})
                        </i>
                    {/if}
                </p>
            </div>
            <div class="from-to-menu">
                {#if Event.isInstantEvent(event)}
                    {#if obfuscated}
                        <div>
                            <i>at</i>
                            <span>
                                <UtcTime
                                    timestamp={event.start}
                                    fmt="DD/MM/YYYY HH:mm"
                                />
                            </span>
                        </div>
                    {:else}
                        <div>
                            <i>at</i>
                            <input
                                class="editable-text"
                                on:change={updateStartAndEnd}
                                placeholder="Start"
                                type="datetime-local"
                                value={fmtTimestampForInput(event.start)}
                            >
                        </div>
                        <button
                            class="link"
                            on:click={makeDurationEvent}
                            use:tooltip={{ content: 'Give this event a duration' }}
                        >
                            <TimelineOutline size="30" />
                        </button>
                    {/if}
                {:else}
                    {#if obfuscated}
                        <div>
                            <i>from</i>
                            <span>
                                <UtcTime
                                    timestamp={event.start}
                                    fmt="DD/MM/YYYY HH:mm"
                                />
                            </span>
                        </div>
                        <div>
                            <i>to</i>
                            <span>
                               <UtcTime
                                   timestamp={event.end}
                                   fmt="DD/MM/YYYY HH:mm"
                               />
                            </span>
                        </div>
                    {:else}
                        <div>
                            <i>from</i>
                            <input
                                class="editable-text"
                                on:change={updateStart}
                                placeholder="Start"
                                type="datetime-local"
                                value={fmtTimestampForInput(event.start)}
                            >
                        </div>
                        <div>
                            <i>to</i>
                            <input
                                class="editable-text"
                                on:change={updateEnd}
                                placeholder="End"
                                type="datetime-local"
                                value={fmtTimestampForInput(event.end)}
                            >
                        </div>
                        <div>
                            <button
                                class="link"
                                on:click={makeInstantEvent}
                                use:tooltip={{ content: 'Make this event instantaneous' }}
                            >
                                <TimelineClockOutline size="30" />
                            </button>
                        </div>
                    {/if}
                {/if}
            </div>
        {:else}
            <button
                aria-label={obfuscated ? 'Show entry' : 'Hide entry'}
                on:click={() => obfuscated = !obfuscated}
            >
                {#if obfuscated}
                    <Eye size="25" />
                {:else}
                    <EyeOff size="25" />
                {/if}
            </button>

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
                >
            {/if}
            <div>
                <span
                    class="entry-label-colour"
                    style="background: {event.label?.colour || 'transparent'}"
                    use:tooltip={{ content: event.label?.name }}
                ></span>

                <button on:click={() => panelOpen = true}>
                    open
                </button>
            </div>
        {/if}
    {/if}
</div>

<style lang="less">
    @import '../../styles/variables.less';
    @import '../../styles/layout.less';

    .event {
        .bordered();
        margin: .3rem .3em;
        padding: .4em;
        border-radius: @border-radius;

        @media @mobile {
            margin: .3rem 0;
            padding: 0.5em 0 1em 0;
            border-radius: 0;
            border: none;
            border-top: 1px solid @border;
        }

        display: grid;
        grid-template-columns: 50px 1fr 70px;

        &.open {
            display: block;
            .header {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;

                @media @mobile {
                    display: block;
                }
            }
        }
    }

    i {
        font-size: 0.8em;
        color: @text-color-light;
    }

    .event-name-inp {
        font-size: 1.4rem;
        display: block;
        margin: 0.4em;
        width: 100%;
    }

    .restore-menu {
        display: block;
        text-align: center;
        margin: 0.4em;
    }

    .from-to-menu {

        display: flex;
        flex-direction: row;
        justify-content: start;
        align-items: center;
        flex-wrap: wrap;

        @media @mobile {
            display: block;
        }

        * {
            margin: 0 0.3em;
        }
    }

    .middle-row {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding: 0 1em 0 0;

        @media @mobile {
            display: block;
        }
    }
</style>