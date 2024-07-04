<script lang="ts">
    import { tooltip } from '@svelte-plugins/tooltips';
    import { createEventDispatcher } from 'svelte';
    import Check from 'svelte-material-icons/Check.svelte';
    import ContentCopy from 'svelte-material-icons/ContentCopy.svelte';
    import Delete from 'svelte-material-icons/DeleteOutline.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import UtcTime from '$lib/components/ui/UtcTime.svelte';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { Asset } from '$lib/controllers/asset/asset';
    import type { TimestampSecs } from '../../../types';

    const dispatch = createEventDispatcher();

    export let id: string;
    export let publicId: string;
    export let fileName: string;
    export let created: TimestampSecs;
    export let obfuscated = true;

    let recentlyCopied = false;
    let deleted = false;

    const confirmDeleteMessage =
        'Are you sure you want to delete this image? ' +
        'This action cannot be undone and will leave' +
        ' broken links in your entries.';

    async function deleteImg() {
        if (!confirm(confirmDeleteMessage)) return;
        notify.onErr(await api.delete(apiPath(`/assets/?`, publicId)));
        notify.success('Deleted asset');
        deleted = true;
        dispatch('delete');
    }

    async function copyToClipBoard() {
        recentlyCopied = true;

        await navigator.clipboard.writeText(Asset.generateMarkdownLink(fileName, publicId));

        notify.success('Copied to clipboard');

        setTimeout(() => (recentlyCopied = false), 3000);
    }
</script>

{#if !deleted}
    <div class="flex-center m-1 relative overflow-hidden wrapper">
        <img alt={fileName} class:obfuscated loading="lazy" src="/api/assets/{publicId}" {id} />
        <div class="menu">
            <div>
                <button
                    aria-label={obfuscated ? 'Show asset' : 'Hide asset'}
                    on:click={() => (obfuscated = !obfuscated)}
                    style="margin: 0 0.5rem 0 0.2rem;"
                >
                    {#if obfuscated}
                        <Eye size="25" />
                    {:else}
                        <EyeOff size="25" />
                    {/if}
                </button>

                {#if recentlyCopied}
                    <Check size="30" />
                {:else}
                    <button
                        on:click={copyToClipBoard}
                        class="icon-button"
                        style="padding: 0.2rem"
                        use:tooltip={{
                            content: 'Copy link',
                            // `overflow: hidden` so needs to show below
                            position: 'bottom'
                        }}
                    >
                        <ContentCopy size="30" />
                    </button>
                {/if}
            </div>
            <div>
                {#if !obfuscated}
                    <UtcTime
                        relative
                        timestamp={created}
                        fmt="MMMM Do YYYY, h:mma"
                        tooltipPosition="bottom"
                    />
                {/if}
            </div>
            <div>
                {#if !obfuscated}
                    <button class="icon-button danger" on:click={deleteImg}>
                        <Delete size="30" />
                    </button>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    @import '$lib/styles/layout';

    .wrapper {
        max-width: min(100%, 20rem);
    }

    img {
        max-height: 100%;
        max-width: 100%;

        &.obfuscated {
            filter: blur(30px);
        }
    }

    .menu {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        position: absolute;
        top: 0;
        right: 0;
        width: 100%;
        height: 50px;
        border-radius: 0 0 $border-radius $border-radius;
        padding: 5px;
        background: var(--transluscent-bg);
        justify-content: center;
        align-items: center;
        transition: opacity #{$transition};
        opacity: 0;

        & > * {
            @extend .flex-center;
        }
    }

    :hover {
        .menu {
            opacity: 1;
        }
    }
</style>
