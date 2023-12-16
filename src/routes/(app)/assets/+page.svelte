<script lang="ts">
    import InfiniteScroller from '$lib/components/InfiniteScroller.svelte';
    import { FILE_INPUT_ACCEPT_TYPES } from '$lib/constants';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { Result } from '$lib/utils/result';
    import { nowUtc } from '$lib/utils/time';
    import Upload from 'svelte-material-icons/Upload.svelte';
    import { currentlyUploadingAssets, navExpanded, obfuscated } from '$lib/stores';
    import type { ChangeEventHandler } from 'svelte/elements';
    import Asset from '$lib/components/asset/Asset.svelte';
    import type { PageData } from './$types';
    import { Asset as IAsset } from '$lib/controllers/asset/asset';

    export let data: PageData;
    let { assets, assetCount } = data;

    async function loadMoreAssets(): Promise<void> {
        const res = notify.onErr(await api.get(`/assets`, { offset: assets.length, count: 8 }));
        assets = [...assets, ...res.assets];
    }

    const upload = (async e => {
        if (!e.target || !('files' in e.target)) {
            return;
        }
        const files = e.target.files as FileList;
        const [uploadedImages, errors] = Result.filter(await IAsset.uploadImages(files));
        notify.error(errors);

        assets = [
            ...uploadedImages.map(({ id, publicId, fileName }) => ({
                id,
                publicId,
                fileName,
                created: nowUtc()
            })),
            ...assets
        ];

        assetCount += uploadedImages.length;
    }) as ChangeEventHandler<HTMLInputElement>;

    let fileDropInput: HTMLInputElement;
</script>

<svelte:head>
    <title>Assets</title>
</svelte:head>

<main class="md:mr-2 {$navExpanded ? 'md:ml-48' : 'md:ml-16'}">
    <div class="p-2">
        <button on:click={() => fileDropInput.click()} class="primary with-icon">
            <Upload size="30" />
            Upload
        </button>
        <input
            type="file"
            on:change={upload}
            bind:this={fileDropInput}
            style="display: none"
            multiple
            accept={FILE_INPUT_ACCEPT_TYPES}
        />
        {#if $currentlyUploadingAssets > 0}
            Uploading {$currentlyUploadingAssets} images...
        {/if}
    </div>

    <InfiniteScroller loadItems={loadMoreAssets} hasMore={() => assets.length < assetCount}>
        {#each assets as asset}
            <Asset {...asset} on:delete={() => assetCount--} obfuscated={$obfuscated} />
        {/each}
    </InfiniteScroller>
</main>

<style lang="scss">
    @import '$lib/styles/layout';

    .head {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        margin: 0;

        i {
            font-size: 0.5em;
            margin-left: 0.5em;
        }

        span {
            margin-left: 0.2em;
        }
    }
</style>
