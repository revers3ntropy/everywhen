<script lang="ts">
    import { onMount } from 'svelte';
    import { slide } from 'svelte/transition';
    import ContentCopy from 'svelte-material-icons/ContentCopy.svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import Restore from 'svelte-material-icons/DeleteRestore.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import NoteEditOutline from 'svelte-material-icons/NoteEditOutline.svelte';
    import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
    import Heart from 'svelte-material-icons/Heart.svelte';
    import HeartOffOutline from 'svelte-material-icons/HeartOffOutline.svelte';
    import Pencil from 'svelte-material-icons/Pencil.svelte';
    import { page } from '$app/stores';
    import * as Tooltip from '$lib/components/ui/tooltip';
    import * as Popover from '$lib/components/ui/popover';
    import TimeInFeed from '$lib/components/feed/feedItems/TimeInFeed.svelte';
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
    import { Button } from '$lib/components/ui/button';
    import Close from 'svelte-material-icons/Close.svelte';
    import { tryDecryptText } from '$lib/utils/encryption.client';

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

    async function decryptImages(html: string) {
        // step 1: find images linking to encrypted everywhen assets
        // TODO step 2: replace with loading placeholder
        // step 3: fetch images
        // step 4: replace image src with decrypted b64 data

        const matches = html.matchAll(
            /<img[^>]*alt="[^"]*"[^>]*src="\/api\/assets\/([a-zA-Z0-9-]*)">/gm
        );

        for (const match of matches) {
            const id = match[1];
            const imageRes = await api.get(apiPath('/assets/?', id));
            if (!imageRes.ok) {
                notify.error('failed to get image');
                continue;
            }
            entryHtml = entryHtml.replace(
                `src="/api/assets/${id}"`,
                `src="data:image/webp;base64,${tryDecryptText(imageRes.val.content)}"`
            );
        }
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

    $: decryptImages(entryHtml);
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
    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {#if !showFullDate}
            <div class="h-full pr-2">
                <TimeInFeed timestamp={created} tzOffset={createdTzOffset} class="pl-2" />
            </div>
        {/if}

        {#if !isEdit}
            <Popover.Root>
                <Popover.Trigger
                    class="flex-center bg-vLightAccent hover:bg-lightAccent rounded-full p-1"
                    aria-label="Open options for entry"
                >
                    <DotsVertical size="22" />
                </Popover.Trigger>
                <Popover.Content class="p-0 -y-2">
                    <div class="text-light flex-center py-3">
                        {wordCount} word{#if wordCount !== 1}s{/if}
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
            <button
                on:click={() => (showingMap = !showingMap)}
                aria-label="Expand map"
                class="bg-vLightAccent hover:bg-lightAccent py-[5px] px-2 {showingMap
                    ? 'rounded-t-xl'
                    : 'rounded-full'}"
            >
                <LocationWidget
                    {locations}
                    {showingMap}
                    {latitude}
                    {longitude}
                    {obfuscated}
                    noLink
                />
            </button>
        {/if}

        {#if !isEdit && edits?.length}
            <a
                href="/journal/{id}?history=on"
                class="flex-center bg-vLightAccent hover:bg-lightAccent rounded-full px-3 h-[30px] oneline"
            >
                <Pencil />
                {edits.length} edit{edits.length > 1 ? 's' : ''}
            </a>
        {/if}

        {#if showLabels}
            <Label label={labelId ? labels[labelId] : null} {obfuscated} />
        {/if}

        <Button
            aria-label={obfuscated ? 'hide entry' : 'show entry'}
            on:click={toggleObfuscation}
            class="flex-center rounded-full p-0 aspect-square w-[30px] h-[30px]"
            variant="outline"
        >
            {#if obfuscated}
                <Eye size="18" />
            {:else}
                <EyeOff size="18" />
            {/if}
        </Button>
    </div>

    {#if showingMap && latitude && longitude}
        <div
            transition:slide={{ duration: ANIMATION_DURATION, axis: 'y' }}
            class="bg-vLightAccent rounded-xl"
        >
            <div class="flex items-center justify-between">
                <div class="p-2">
                    <LocationWidget
                        {locations}
                        {showingMap}
                        {latitude}
                        {longitude}
                        {obfuscated}
                        noChevron
                        fullAddress
                    />
                    <p class="italic text-light text-sm pt-2">
                        lat {latitude.toFixed(5)}, lng {longitude.toFixed(5)}
                    </p>
                </div>

                <Button
                    on:click={() => (showingMap = false)}
                    class="flex-center rounded-full px-2 py-5 aspect-square border-none bg-transparent"
                    variant="outline"
                >
                    <Close size={22} />
                </Button>
            </div>

            <div class="h-[200px] md:h-[300px] border-borderHeavy border-2 rounded-xl">
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
    {#if title}
        <div class="text-lg font-bold p-2 md:px-4 pb-0" class:obfuscated>
            {title}
        </div>
    {/if}

    {#if obfuscated}
        <Tooltip.Root>
            <Tooltip.Trigger>
                <button
                    class="body p-2 md:p-0 md:pt-1 md:pl-4 whitespace-pre-wrap obfuscated text-left"
                    class:md:pl-0={showFullDate}
                    on:click={toggleObfuscation}
                >
                    {@html entryHtml}
                </button>
            </Tooltip.Trigger>
            <Tooltip.Content>Click to show</Tooltip.Content>
        </Tooltip.Root>
    {:else}
        <div
            class="body p-2 md:p-0 md:pt-1 md:pl-4 whitespace-pre-wrap"
            class:md:pl-0={showFullDate}
        >
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
                line-height: 1.6rem;
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
</style>
