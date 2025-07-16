<script lang="ts">
    import { onMount } from 'svelte';
    import { slide } from 'svelte/transition';
    import ContentCopy from 'svelte-material-icons/ContentCopy.svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import Restore from 'svelte-material-icons/DeleteRestore.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import NoteEditOutline from 'svelte-material-icons/NoteEditOutline.svelte';
    import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
    import Heart from 'svelte-material-icons/Heart.svelte';
    import HeartOffOutline from 'svelte-material-icons/HeartOffOutline.svelte';
    import Pencil from 'svelte-material-icons/Pencil.svelte';
    import { page } from '$app/stores';
    import * as Tooltip from '$lib/components/ui/tooltip';
    import * as Popover from '$lib/components/ui/popover';
    import TimeInFeed from '$lib/components/feed/TimeInFeed.svelte';
    import Lazy from '$lib/components/ui/Lazy.svelte';
    import { type EntryEdit } from '$lib/controllers/entry/entry';
    import { fmtUtcRelative, nowUtc } from '$lib/utils/time';
    import type { Location } from '$lib/controllers/location/location';
    import type { Label as LabelController } from '../../controllers/label/label';
    import { dispatch } from '$lib/dataChangeEvents';
    import { Entry } from '$lib/controllers/entry/entry';
    import { encryptionKey, settingsStore, username } from '$lib/stores';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { rawMdToHtml } from '$lib/utils/text';
    import UtcTime from '$lib/components/ui/UtcTime.svelte';
    import AgentWidget from './UserAgentWidget.svelte';
    import Label from '$lib/components/label/Label.svelte';
    import LocationWidget from '../location/LocationWidget.svelte';

    export let id: string;
    export let title: string;
    export let body: string;
    export let created: number;
    export let createdTzOffset: number;
    export let labelId: string | null;
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
    export let isInDialog = false;

    export let locations: Location[];
    export let labels: Record<string, LabelController>;

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

        // TODO how to clear dialog if this entry is in one?

        notify.success(`Entry ${thisIsDeleted ? 'restored' : 'deleted'}`);
        await dispatch.delete('entry', id);
        deleted = thisIsDeleted ? null : nowUtc();
    }

    async function togglePinned() {
        notify.onErr(
            await api.put(apiPath('/entries/?/pinned', id), {
                pinned: !Entry.isPinned({ pinned })
            })
        );

        const actionFmt = !Entry.isPinned({ pinned }) ? 'favorited' : 'unfavorited';
        notify.success(`Entry ${actionFmt}`);

        const oldEntry: Entry = {
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
            labelId,
            edits
        };

        pinned = Entry.isPinned({ pinned }) ? null : nowUtc();

        const newEntry: Entry = {
            ...oldEntry,
            pinned
        };
        await dispatch.update('entry', newEntry, oldEntry);
    }

    function toggleObfuscation() {
        obfuscated = !obfuscated;
    }

    async function copyToClipBoard() {
        await navigator.clipboard.writeText(`${location.host}/journal/${id}`);
        notify.success('Copied link to clipboard');
    }

    let showingMap = false;
    let containerDiv: HTMLDivElement;

    $: isFocused = $page.url.hash.endsWith(id);

    // listen for ctrl/cmd + q to quote
    $: containerDiv?.addEventListener('keydown', e => {
        if (!(e.ctrlKey || e.metaKey) || e.key !== 'q') return;
        e.preventDefault();

        const quote = window.getSelection()?.toString();
        if (!quote) return;
        Entry.quoteEntryInEntryForm($username!, $encryptionKey!, id, quote);
    });

    // cannot generate HTML server-side
    let entryHtml = '...';
    onMount(() => {
        entryHtml = rawMdToHtml(body);

        if (isFocused) {
            setTimeout(() => {
                containerDiv.scrollIntoView();
            }, 0);
        }
    });
</script>

<div
    class="entry w-full h-fit pt-2 outline-none border border-transparent rounded-md"
    class:in-dialog={isInDialog}
    {id}
    style={isFocused && !isInDialog ? 'border-color: var(--secondary)' : ''}
    bind:this={containerDiv}
    tabindex="-1"
>
    {#if showFullDate}
        <div class="text-light pb-2">
            <UtcTime fmt={'h:mma ddd DD MMM YYYY'} timestamp={created} tzOffset={createdTzOffset} />
        </div>
    {/if}
    <div class="flex items-center gap-2" style="max-width: calc(100% - 60px)">
        {#if !showFullDate}
            <div class="h-full pr-2">
                <TimeInFeed timestamp={created} tzOffset={createdTzOffset} />
            </div>
        {/if}

        {#if !isEdit}
            <Popover.Root>
                <Popover.Trigger class="flex-center" aria-label="Open options for entry">
                    <DotsVertical size="22" />
                </Popover.Trigger>
                <Popover.Content class="p-0 -y-2">
                    <div class="text-light flex-center py-3">
                        {wordCount} words
                    </div>

                    <div class="border-t border-backgroundColor"></div>

                    <div class="options-dropdown">
                        <button
                            class="with-icon icon-gradient-on-hover"
                            aria-label="Copy link to entry"
                            on:click={copyToClipBoard}
                        >
                            <ContentCopy size="25" />
                            Copy link
                        </button>

                        {#if !Entry.isDeleted({ deleted })}
                            {#if Entry.isPinned({ pinned })}
                                <button
                                    on:click={togglePinned}
                                    class="with-icon icon-gradient-on-hover"
                                    aria-label="Remove from Favourites"
                                >
                                    <HeartOffOutline size="25" />
                                    Remove from Favourites
                                </button>
                            {:else}
                                <button
                                    on:click={togglePinned}
                                    class="with-icon icon-gradient-on-hover"
                                    aria-label="Add to Favourites"
                                >
                                    <Heart size="25" />
                                    Add to Favourites
                                </button>
                            {/if}
                            <a href="/journal/{id}/edit" class="with-icon" aria-label="edit entry">
                                <NoteEditOutline size="25" />
                                Edit
                            </a>
                        {/if}
                        {#key deleted}
                            <button
                                on:click={deleteSelf}
                                class="with-icon danger"
                                aria-label={Entry.isDeleted({ deleted })
                                    ? 'Restore Entry'
                                    : 'Move Entry to Bin'}
                            >
                                {#if Entry.isDeleted({ deleted })}
                                    <Restore size="25" />
                                    Remove from Bin
                                {:else}
                                    <Bin size="25" />
                                    Move to Bin
                                {/if}
                            </button>
                        {/key}
                    </div>
                </Popover.Content>
            </Popover.Root>
        {/if}

        {#if pinned !== null}
            <Tooltip.Root>
                <Tooltip.Trigger class="gradient-icon"><Heart size="20" /></Tooltip.Trigger>
                <Tooltip.Content>
                    Added to favourites {fmtUtcRelative(pinned)}
                </Tooltip.Content>
            </Tooltip.Root>
        {/if}

        {#if $settingsStore.showAgentWidgetOnEntries.value}
            <AgentWidget data={agentData} />
        {/if}

        {#if latitude && longitude}
            <button on:click={() => (showingMap = !showingMap)} aria-label="Expand map">
                <LocationWidget {locations} {showingMap} {latitude} {longitude} {obfuscated} />
            </button>
        {/if}

        {#if !isEdit && edits?.length}
            <a href="/journal/{id}?history=on" class="edits-link link flex-center">
                <Pencil />
                {edits.length} edit{edits.length > 1 ? 's' : ''}
            </a>
        {/if}

        {#if showLabels}
            <Label label={labelId ? labels[labelId] : null} {obfuscated} />
        {/if}

        <div class="title" class:obfuscated>
            {title}
        </div>

        {#if !obfuscated}
            <div class="pl-2">
                <button aria-label="Show entry" on:click={toggleObfuscation}>
                    <EyeOff size="20" />
                </button>
            </div>
        {/if}
    </div>

    {#if showingMap && latitude && longitude}
        <div transition:slide={{ duration: ANIMATION_DURATION, axis: 'y' }} class="map-container">
            <i class="text-light text-sm pb-1">
                lat {latitude.toFixed(5)}, lng {longitude.toFixed(5)}
            </i>
            <div class="h-[200px] md:h-[300px]">
                <Lazy
                    shouldLoad={showingMap}
                    key="$lib/components/map/Mapbox.svelte"
                    component={() => import('$lib/components/map/Mapbox.svelte')}
                    props={{
                        entriesInteractable: false,
                        class: 'rounded-lg',
                        defaultCenter: { lat: latitude, lng: longitude },
                        defaultZoom: 15,
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
        </div>
    {/if}
    <div class="text-lg only-mobile p-2" class:obfuscated>
        {title}
    </div>

    {#if obfuscated}
        <Tooltip.Root>
            <Tooltip.Trigger>
                <button
                    class="body md:p-4 md:pb-0 p-2 whitespace-pre-wrap obfuscated text-left"
                    class:md:pl-0={showFullDate}
                    on:click={toggleObfuscation}
                >
                    {@html entryHtml}
                </button>
            </Tooltip.Trigger>
            <Tooltip.Content>
                <p>Click to show</p>
            </Tooltip.Content>
        </Tooltip.Root>
    {:else}
        <div class="body md:p-4 md:pb-0 p-2 whitespace-pre-wrap" class:md:pl-0={showFullDate}>
            {@html entryHtml}
        </div>
    {/if}
</div>

<style lang="scss">
    @import '$lib/styles/text';
    @import '$lib/styles/variables';

    .entry {
        // so images don't appear too large
        :global(img) {
            max-width: 100%;
            height: 250px;
            transition: opacity $transition;
            border-radius: 0.5rem;
        }

        .obfuscated :global(img) {
            opacity: 0.01;
        }

        .title {
            @extend .ellipsis;
            font-size: 1.1em;
            font-weight: 500;

            @media #{$mobile} {
                display: none;
            }
        }

        .body {
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
                margin: -1rem 0;
                padding: 0 0 0 1.5em;
                border: none;

                :global(li:has(input[type='checkbox'])) {
                    list-style-type: none;
                }

                :global(li) {
                    margin: 0;
                    padding: 0;
                    border: none;
                    position: relative;

                    :global(input[type='checkbox']) {
                        position: absolute;
                        left: -22px;
                        top: 2px;
                        opacity: 1;
                    }
                }
            }
            :global(ul) {
                list-style-type: disc;
            }
            :global(ol) {
                list-style-type: decimal;
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
    }

    .edits-link {
        font-size: 0.95rem;
        white-space: nowrap;
    }

    .options-dropdown {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 100px;
        padding: 0.5rem 0;

        button,
        a {
            @extend .oneline;
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

        @media #{$mobile} {
            margin: 0.5rem 0;
        }
    }
</style>
