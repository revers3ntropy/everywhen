<script lang="ts">
    import { browser } from '$app/environment';
    // @ts-ignore
    import { tooltip } from '@svelte-plugins/tooltips';
    import DomPurify from 'dompurify';
    import { marked } from 'marked';
    import { createEventDispatcher } from 'svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import Restore from 'svelte-material-icons/DeleteRestore.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import NoteEditOutline from 'svelte-material-icons/NoteEditOutline.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import UtcTime from '../../lib/components/UtcTime.svelte';
    import type { Entry } from '../controllers/entry';
    import type { Label as LabelController } from '../controllers/label';
    import type { Auth } from '../controllers/user';
    import { popup } from '../stores';
    import { api, apiPath } from '../utils/apiRequest';
    import { displayNotifOnErr, SUCCESS_NOTIFICATION } from '../utils/notifications';
    import { obfuscate } from '../utils/text';
    import Label from './Label.svelte';

    const dispatch = createEventDispatcher();
    const { addNotification } = getNotificationsContext();

    export let id = '';
    export let title = '';
    export let entry = '';
    export let created: number;
    export let createdTZOffset = 0;
    export let label: LabelController | null | undefined =
        undefined as LabelController | null | undefined;
    export let latitude: number | null = null;
    export let longitude: number | null = null;
    export let deleted = false;
    export let decrypted = true;
    export let edits: Entry[] = [];
    export let isEdit = false;
    export let showFullDate = false;

    export let obfuscated = true;
    export let showLabels = true;
    export let isInDialog = false;

    export let auth: Auth;

    // show random string instead of text content if obfuscated
    export let showLabel: LabelController | null | undefined = label;
    $: if (showLabels && ((l): l is LabelController => !!l)(label)) {
        showLabel = {
            ...label,
            name: obfuscated ? obfuscate(label.name) : label.name,
        };
    }

    async function deleteSelf () {
        if (!confirm(`Are you sure you want to ${deleted ? 'restore' : 'delete'} this entry?`)) {
            return;
        }

        displayNotifOnErr(addNotification,
            await api.delete(auth, apiPath('/entries/?', id), {
                restore: !!deleted,
            }),
        );

        if (isInDialog) popup.set(null);

        addNotification({
            ...SUCCESS_NOTIFICATION,
            text: `Entry ${deleted ? 'restored' : 'deleted'}`,
        });
        dispatch('updated');
    }

    function toggleObfuscation () {
        obfuscated = !obfuscated;
    }

    $: entryHtml = browser ? DomPurify.sanitize(
        marked(obfuscated ? obfuscate(entry) : entry),
        { USE_PROFILES: { html: true } },
    ) : '';
    // doesn't set reactivity on tooltip content if in props???
    $: restoreDeleteTooltip = deleted ? 'Restore Entry' : 'Delete Entry';
</script>

<div class="entry {obfuscated ? '' : 'visible'}">
    <p class="mobile-title {obfuscated ? 'obfuscated' : ''}">
        {obfuscated ? obfuscate(title) : title}
    </p>
    <div class="header">
        <div class="flex-center">
            <span class="time">
                <UtcTime
                    fmt={showFullDate ? 'DD-MM-YYYY h:mm A' : 'h:mm A'}
                    timestamp={created}
                    tzOffset={createdTZOffset}
                />
            </span>
            <Label label={showLabel} obfuscated={obfuscated} />
        </div>

        <div class="title {obfuscated ? 'obfuscated' : ''}">
            {obfuscated ? obfuscate(title) : title}
        </div>

        <div class="flex-center">
            {#if !obfuscated && !isEdit}
                {#if edits.length}
                    <a href="/diary/{id}?history=on&obfuscate=0" class="link">
                        {edits.length} edit{edits.length > 1 ? 's' : ''}
                    </a>
                {/if}
                <button
                    on:click={deleteSelf}
                    aria-label={deleted ? 'Restore' : 'Delete'}
                    use:tooltip={{ content: restoreDeleteTooltip }}
                >
                    {#if deleted}
                        <Restore size="25" />
                    {:else}
                        <Bin size="25" />
                    {/if}
                </button>
                {#if !deleted}
                    <a
                        href="/diary/{id}/edit?obfuscate=0"
                        use:tooltip={{ content: 'Edit Entry' }}
                    >
                        <NoteEditOutline size="25" />
                    </a>
                {/if}
            {/if}

            <button
                aria-label={obfuscated ? 'Show entry' : 'Hide entry'}
                on:click={toggleObfuscation}
            >
                {#if obfuscated}
                    <Eye size="25" />
                {:else}
                    <EyeOff size="25" />
                {/if}
            </button>
        </div>
    </div>
    <p class="body {obfuscated ? 'obfuscated' : ''}">
        {@html entryHtml}
    </p>
</div>

<style lang="less">
    @import '../../styles/variables.less';

    .entry {
        padding: .8em 0;
        margin: 0;
        height: fit-content;
        white-space: pre-wrap;

        border: 1px solid transparent;

        &.visible {
            border-image: linear-gradient(transparent,
            @accent-color-secondary, transparent) 1 100%;
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
            border-bottom: 1px solid @border;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 0.5em 2em 0 0;
            padding: 0.3em;

            @media @mobile {
                margin: 0;
            }

            :global(svg) {
                color: @text-color-light;
            }
        }

        .title {
            font-size: 1.2em;
            white-space: nowrap;
            overflow-x: scroll;

            @media @mobile {
                display: none;
            }
        }

        .time {
            margin: 0 0 0 0.5rem;
            font-size: 0.8em;
            color: @text-color-light;
        }

        .body {
            margin: 0 2rem;
            word-break: break-word;
            max-width: 700px;

            @media @mobile {
                margin: 0 .5rem;
            }

            // inner <p> element is created when using @html
            :global(p) {
                margin: 0;
                padding: 0;
                border: none;
            }

            // generated from markdown

            :global(ul), :global(ol) {
                // ugh
                margin: -2.5rem 0 -2.5rem .8rem;
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

                    :global(td), :global(th) {
                        border: 1px solid @border;

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
                border-left: 3px solid @accent-color-secondary;
                margin: 0 0 0 .5em;
                padding: 0 0 0 1em;
            }
        }

        .mobile-title {
            display: none;
            margin: 2rem 0 -1.2rem .5rem;
            font-size: 1.1em;
            text-align: center;

            @media @mobile {
                display: block;
            }
        }
    }
</style>
