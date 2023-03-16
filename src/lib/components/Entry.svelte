<script lang="ts">
    import { browser } from '$app/environment';
    import DomPurify from 'dompurify';
    import { marked } from 'marked';
    import moment from 'moment';
    import { createEventDispatcher } from 'svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import Restore from 'svelte-material-icons/DeleteRestore.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import { api, apiPath } from '../api/apiQuery';
    import type { Label as LabelController } from '../controllers/label';
    import type { Auth } from '../controllers/user';
    import { displayNotifOnErr, obfuscate } from '../utils';
    import Label from './Label.svelte';

    const dispatch = createEventDispatcher();
    const { addNotification } = getNotificationsContext();

    export let id = '';
    export let title = '';
    export let entry = '';
    export let created = 0;
    export let label: LabelController | null = null;
    export let latitude: number | null = null;
    export let longitude: number | null = null;
    export let deleted = false;

    export let obfuscated = true;
    export let showLabels = true;

    export let auth: Auth;

    // show random string instead of text content if obfuscated
    export let showLabel: LabelController | null;
    $: if (showLabels && ((l): l is LabelController => !!l)(label)) {
        showLabel = {
            ...label,
            name: obfuscated ? obfuscate(label.name) : label.name,
        };
    } else {
        showLabel = null;
    }

    async function deleteSelf () {
        if (!confirm(`Are you sure you want to ${deleted ? 'restore' : 'delete'} this entry?`)) {
            return;
        }

        displayNotifOnErr(addNotification,
            await api.delete(auth, apiPath('/entries/', id), {
                restore: !!deleted,
            }),
        );

        addNotification({
            removeAfter: 4000,
            text: `Entry ${deleted ? 'restored' : 'deleted'}`,
            type: 'success',
            position: 'top-center',
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
</script>

<div class="entry {obfuscated ? '' : 'visible'}">
    <div class="header">
        <div>
			<span class="time">
				{moment(new Date(created * 1000)).format('h:mm A')}
			</span>
            <Label label={showLabel} obfuscated={obfuscated} />
        </div>
        <div class="title {obfuscated ? 'obfuscated' : ''}">
            {obfuscated ? obfuscate(title) : title}
        </div>

        <div>
            {#if !obfuscated}
                <button
                    on:click={deleteSelf}
                    aria-label={deleted ? 'Restore' : 'Delete'}
                >
                    {#if deleted}
                        <Restore size="25" />
                    {:else}
                        <Bin size="25" />
                    {/if}
                </button>
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

        &.visible {
            border-left: 1px solid @border-heavy;
            //background: #2D2D2D
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
        }

        .time {
            margin: 0 0 0 0.5rem;
            font-size: 0.8em;
            color: @text-color-light;
        }

        .body {
            margin: 0 2em;
            word-break: break-word;

            // inner <p> element is created when using @html
            :global(p) {
                margin: 0;
                padding: 0;
                border: none;
            }
        }
    }
</style>
