<script lang="ts">
    import { tooltip } from '@svelte-plugins/tooltips';
    import { createEventDispatcher, onMount } from 'svelte';
    import Check from 'svelte-material-icons/Check.svelte';
    import ContentCopy from 'svelte-material-icons/ContentCopy.svelte';
    import Delete from 'svelte-material-icons/Delete.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import UtcTime from '../../lib/components/UtcTime.svelte';
    import { Asset } from '../../lib/controllers/asset';
    import type { Auth } from '../../lib/controllers/user';
    import { api, apiPath } from '../../lib/utils/apiRequest';
    import { displayNotifOnErr, SUCCESS_NOTIFICATION } from '../../lib/utils/notifications';
    import type { TimestampSecs } from '../../lib/utils/types';

    const { addNotification } = getNotificationsContext();
    const dispatch = createEventDispatcher();

    export let id: string;
    export let publicId: string;
    export let fileName: string;
    export let contentType: string;
    export let created: TimestampSecs;
    export let obfuscated = true;
    export let auth: Auth;

    let recentlyCopied = false;
    let deleted = false;

    async function deleteImg () {
        if (!confirm(
            'Are you sure you want to delete this image? '
            + 'This action cannot be undone and will leave'
            + ' broken links in your entries.',
        )) return;
        displayNotifOnErr(addNotification,
            await api.delete(auth, apiPath(`/assets/?`, publicId)),
        );
        addNotification({
            ...SUCCESS_NOTIFICATION,
            text: 'Deleted asset',
        });
        deleted = true;
        dispatch('delete');
    }

    async function copyToClipBoard () {
        recentlyCopied = true;
        await navigator.clipboard.writeText(Asset.markDownLink(fileName, publicId));
        addNotification({
            ...SUCCESS_NOTIFICATION,
            text: 'Copied to clipboard',
        });
        setTimeout(() => recentlyCopied = false, 3000);
    }

    onMount(() => document.title = 'Assets');
</script>

<div class="img-wrapper {deleted ? 'deleted' : ''}">
    <img
        alt={fileName}
        class="{obfuscated ? 'obfuscated' : ''}"
        loading="lazy"
        src="/api/assets/{publicId}"
    />
    <div class="menu">
        <div>
            <button
                aria-label={obfuscated ? 'Show asset' : 'Hide asset'}
                on:click={() => obfuscated = !obfuscated}
            >
                {#if obfuscated}
                    <Eye size="25" />
                {:else}
                    <EyeOff size="25" />
                {/if}
            </button>
            {#if !obfuscated}
                {#if recentlyCopied}
                    <Check size="30" />
                {:else}
                    <button
                        on:click={copyToClipBoard}
                        class="icon-button"
                        use:tooltip={{
                            content: 'Copy link',
                            // `overflow: hidden` so needs to show below
                            position: 'bottom',
                        }}
                    >
                        <ContentCopy size="30" />
                    </button>
                {/if}
            {/if}
        </div>
        <div>
            {#if !obfuscated}
                <!-- TODO use tzOffset from db -->
                <UtcTime
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


<style lang="less">
    @import '../../styles/variables';
    @import '../../styles/layout';

    .img-wrapper {
        .bordered();
        .flex-center();

        position: relative;

        border-radius: @border-radius;
        margin: .5rem;

        height: 50vh;
        aspect-ratio: 1/1;
        overflow: hidden;

        img {
            max-height: 100%;
            max-width: 100%;

            &.obfuscated {
                filter: blur(30px);
            }
        }

        .menu {
            position: absolute;
            top: 0;
            right: 0;
            width: 100%;
            height: 50px;
            border-radius: 5px;
            padding: 5px;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: space-between;
            align-items: center;

            & > * {
                .flex-center();
            }
        }

        &.deleted {
            display: none;
        }
    }
</style>