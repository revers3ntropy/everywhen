<script lang="ts">
    import { browser } from '$app/environment';
    import Lazy from '$lib/components/Lazy.svelte';
    import type { EntryEdit } from '$lib/controllers/entry/entry';
    import { fmtUtcRelative, nowUtc } from '$lib/utils/time';
    import { slide } from 'svelte/transition';
    import { tooltip } from '@svelte-plugins/tooltips';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import Restore from 'svelte-material-icons/DeleteRestore.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import NoteEditOutline from 'svelte-material-icons/NoteEditOutline.svelte';
    import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
    import Heart from 'svelte-material-icons/Heart.svelte';
    import HeartOffOutline from 'svelte-material-icons/HeartOffOutline.svelte';
    import type { Location } from '$lib/controllers/location/location';
    import type { Label as LabelController } from '../../controllers/label/label';
    import { dispatch } from '$lib/dataChangeEvents';
    import { Entry } from '$lib/controllers/entry/entry';
    import { popup, settingsStore } from '$lib/stores';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { obfuscate, rawMdToHtml } from '$lib/utils/text';
    import UtcTime from '$lib/components/UtcTime.svelte';
    import Dropdown from '$lib/components/Dropdown.svelte';
    import AgentWidget from './AgentWidget.svelte';
    import Pencil from 'svelte-material-icons/Pencil.svelte';
    import Label from '$lib/components/label/Label.svelte';
    import LocationWidget from '../location/LocationWidget.svelte';

    export let id: string;
    export let title: string;
    export let body: string;
    export let created: number;
    export let createdTzOffset: number;
    export let label: LabelController | null;
    export let latitude: number | null;
    export let longitude: number | null;
    export let deleted: null | number;
    export let pinned: null | number;
    export let wordCount: number;
    export let agentData: string;
    export let edits: EntryEdit[];

    export let isEdit = false;
    export let showFullDate = false;

    export let obfuscated = true;
    export let showLabels = true;
    export let showLocations = true;
    export let isInDialog = false;

    export let locations: Location[] | null;

    async function deleteSelf() {
        const thisIsDeleted = Entry.isDeleted({ deleted });
        const fmtAction = thisIsDeleted ? 'restore' : 'delete';
        const confirmMsg = `Are you sure you want to ${fmtAction} this entry?`;
        if (!confirm(confirmMsg)) return;

        notify.onErr(
            await api.delete(apiPath('/entries/?', id), {
                restore: !!thisIsDeleted
            })
        );

        if (isInDialog) popup.set(null);

        notify.success(`Entry ${thisIsDeleted ? 'restored' : 'deleted'}`);
        await dispatch.delete('entry', id);
    }

    async function togglePinned() {
        notify.onErr(
            await api.put(apiPath('/entries/?/pinned', id), {
                pinned: !Entry.isPinned({ pinned })
            })
        );

        const actionFmt = !Entry.isPinned({ pinned }) ? 'favorited' : 'unfavorited';
        notify.success(`Entry ${actionFmt}`);

        pinned = Entry.isPinned({ pinned }) ? null : nowUtc();

        const changed: Entry = {
            id,
            title,
            body,
            created,
            createdTzOffset,
            pinned,
            deleted,
            latitude,
            longitude,
            agentData,
            wordCount,
            label,
            edits
        };
        await dispatch.update('entry', changed);
    }

    // show random string instead of text content if obfuscated
    let showLabel = label;
    $: if (showLabels && label) {
        showLabel = {
            ...label,
            name: obfuscated ? obfuscate(label.name) : label.name
        };
    }

    function toggleObfuscation() {
        obfuscated = !obfuscated;
    }

    let showingMap = false;

    $: entryHtml = browser ? rawMdToHtml(body, obfuscated) : '';
    // doesn't set reactively on tooltip content if in props???
    $: restoreDeleteTooltip = Entry.isDeleted({ deleted }) ? 'Restore Entry' : 'Move Entry to Bin';
    $: pinTooltip = Entry.isPinned({ pinned }) ? 'Unpin Entry' : 'Pin Entry';
</script>

<div class="entry" class:in-dialog={isInDialog} {id}>
    {#if showFullDate}
        <div class="text-light">
            <UtcTime
                fmt={'ddd DD MMM YYYY, h:mma'}
                timestamp={created}
                tooltipPosition="right"
                tzOffset={createdTzOffset}
            />
        </div>
    {/if}
    <p class="mobile-title" class:obfuscated>
        {obfuscated ? obfuscate(title) : title}
    </p>
    <div class="header">
        <div style="display: flex; align-items: center; max-width: calc(100% - 60px); gap: 0.5rem;">
            {#if !showFullDate}
                <span class="time">
                    <UtcTime
                        fmt={'h:mma'}
                        timestamp={created}
                        tooltipPosition="right"
                        tzOffset={createdTzOffset}
                    />
                </span>
            {/if}

            {#if pinned !== null}
                <span
                    class="gradient-icon"
                    use:tooltip={{
                        content: `<span class="oneline">Favourited ${fmtUtcRelative(pinned)}</span>`
                    }}
                >
                    <Heart size="20" />
                </span>
            {/if}

            {#if $settingsStore.showAgentWidgetOnEntries.value}
                <AgentWidget data={agentData} />
            {/if}

            {#if latitude && longitude && showLocations}
                <button on:click={() => (showingMap = !showingMap)} aria-label="Expand map">
                    <LocationWidget {locations} entryId={id} {latitude} {longitude} {obfuscated} />
                </button>
            {/if}

            {#if !isEdit && edits?.length}
                <a href="/journal/{id}?history=on" class="edits-link link flex-center">
                    <Pencil />
                    {edits.length} edit{edits.length > 1 ? 's' : ''}
                </a>
            {/if}

            {#if showLabels}
                <Label label={showLabel} {obfuscated} />
            {/if}

            <div class="title {obfuscated ? 'obfuscated' : ''}">
                {obfuscated ? obfuscate(title) : title}
            </div>
        </div>

        <div class="flex-center">
            {#if !isEdit}
                <Dropdown fromRight>
                    <div slot="button" class="options-dropdown-button">
                        <DotsVertical size="22" />
                    </div>
                    <div>
                        <div class="text-light flex-center" style="padding: 6px">
                            {wordCount} words
                        </div>

                        <hr />

                        <div class="options-dropdown">
                            <button
                                on:click={togglePinned}
                                class="with-icon icon-gradient-on-hover"
                                aria-label={pinTooltip}
                            >
                                {#if Entry.isPinned({ pinned })}
                                    <HeartOffOutline size="25" />
                                    Un-favourite
                                {:else}
                                    <Heart size="25" />
                                    Favourite
                                {/if}
                            </button>
                            {#if !Entry.isDeleted({ deleted })}
                                <a
                                    href="/journal/{id}/edit"
                                    class="with-icon"
                                    aria-label="edit entry"
                                >
                                    <NoteEditOutline size="25" />
                                    Edit
                                </a>
                            {/if}
                            <button
                                on:click={deleteSelf}
                                class="with-icon danger"
                                aria-label={restoreDeleteTooltip}
                            >
                                {#if Entry.isDeleted({ deleted })}
                                    <Restore size="25" />
                                    Remove from Bin
                                {:else}
                                    <Bin size="25" />
                                    Move to Bin
                                {/if}
                            </button>
                        </div>
                    </div>
                </Dropdown>
            {/if}

            <button
                aria-label={obfuscated ? 'Show entry' : 'Hide entry'}
                on:click={toggleObfuscation}
                style="margin: 0 0.3rem 0 0"
            >
                {#if obfuscated}
                    <Eye size="25" />
                {:else}
                    <EyeOff size="25" />
                {/if}
            </button>
        </div>
    </div>

    {#if showingMap}
        <i class="text-light" style="font-size: 0.9rem">
            Created at lat {latitude}, lng {longitude}
        </i>
        <div transition:slide={{ duration: ANIMATION_DURATION, axis: 'y' }} class="map-container">
            <Lazy
                shouldLoad={showingMap}
                key="$lib/components/map/Map.svelte"
                component={() => import('$lib/components/map/Map.svelte')}
                props={{
                    entriesInteractable: false,
                    width: '100%',
                    height: '300px',
                    mobileHeight: '200px',
                    entries: [
                        {
                            id,
                            created,
                            latitude,
                            longitude
                        }
                    ]
                }}
            />
        </div>
    {/if}

    <hr />

    <p class="body" class:obfuscated>
        {@html entryHtml}
    </p>
</div>

<style lang="less">
    @import '../../../styles/text';
    @import '../../../styles/variables';

    hr {
        margin: -16px 0 -10px 0;
        border-top-color: var(--border-light);
    }

    .entry {
        padding: 0;
        margin: 0;
        width: 100%;
        height: fit-content;
        white-space: pre-wrap;
        border: 1px solid transparent;
        outline: none;

        &,
        * {
            font-size: 1.05rem;
        }

        &:focus {
            border: 1px solid var(--primary);
            border-radius: @border-radius;
        }

        @media @mobile {
            padding: 0;
        }

        // so images don't appear too large
        :global(img) {
            max-width: 100%;
            max-height: 50vh;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 0;
            padding: 0;
            width: 100%;
            max-width: 100%;

            @media @mobile {
                margin: 0;
                padding: 0;
            }

            :global(svg) {
                color: var(--text-color-light);
            }
        }

        .title {
            .ellipsis();
            font-size: 1.1em;
            font-weight: 500;

            @media @mobile {
                display: none;
            }
        }

        .time {
            margin: 0 2px 0 0.5rem;
            font-size: 0.8em;
            color: var(--text-color-light);
        }

        .body {
            margin: 0 2rem;
            word-break: break-word;
            max-width: 700px;

            @media @mobile {
                margin: 0 0.5rem;
            }

            // inner <p> element is created when using @html
            :global(p) {
                margin: 0;
                padding: 0;
                border: none;
            }

            // generated from markdown

            :global(ul),
            :global(ol) {
                // ugh
                margin: -2.5rem 0 -2.5rem 0.8rem;
                padding: 0;
                border: none;

                :global(li) {
                    margin: 0;
                    padding: 0;
                    border: none;
                }
            }

            :global(table) {
                border-collapse: collapse;

                :global(tr) {
                    :global(td),
                    :global(th) {
                        border: 1px solid var(--border-color);

                        margin: 0;
                        padding: 0.3rem;
                        text-align: center;
                    }

                    :global(th) {
                        font-size: 1.2rem;
                    }
                }
            }

            :global(blockquote) {
                border-left: 3px solid var(--primary);
                margin: 0 0 0 0.5em;
                padding: 0 0 0 1em;
            }
        }

        .mobile-title {
            display: none;
            margin: 2rem 0 -1.2rem 0.5rem;
            font-size: 1.1em;
            text-align: center;

            @media @mobile {
                display: block;
            }
        }
    }

    .edits-link {
        font-size: 0.95rem;
        white-space: nowrap;
    }

    .options-dropdown-button {
        margin: 0;
        padding: 0;
    }

    .options-dropdown {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 100px;
        padding: 0.5rem 0;

        button,
        a {
            .oneline();
            display: grid;
            grid-template-columns: auto 1fr;
            text-align: left;
            padding: 0.4em 0.8rem;
            width: 100%;
            color: var(--text-color);
            &:hover {
                background: var(--v-light-accent);
            }
        }
    }

    .map-container {
        margin: 0.5rem 1rem 1rem 1rem;

        @media @mobile {
            margin: 0.5rem 0;
        }
    }
</style>
