<script lang="ts">
    import { browser } from '$app/environment';
    import { uploadImage } from '$lib/components/asset/uploadImage';
    import InfiniteScroller from '$lib/components/InfiniteScroller.svelte';
    import { api } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import { nowUtc } from '$lib/utils/time';
    import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
    import Upload from 'svelte-material-icons/Upload.svelte';
    import Dot from '$lib/components/Dot.svelte';
    import { obfuscated } from '$lib/stores';
    import type { ChangeEventHandler } from 'svelte/elements';
    import Asset from './Asset.svelte';
    import type { PageData } from './$types';
    import type { Asset as IAsset } from '$lib/controllers/asset/asset';

    export let data: PageData;

    let { assets, assetCount } = data;

    async function loadMoreAssets(
        offset: number,
        count: number
    ): Promise<Omit<IAsset, 'content'>[]> {
        const res = displayNotifOnErr(await api.get(`/assets`, { offset, count }));
        return res.assets;
    }

    const upload = (async e => {
        if (e.target === null || !('files' in e.target)) {
            return;
        }
        const files = e.target.files as FileList;
        const res = await uploadImage(files);
        if (res === null) {
            return;
        }
        const { id, publicId, fileName } = res;

        assets = [
            {
                id,
                publicId,
                fileName,
                created: nowUtc()
            },
            ...assets
        ];

        assetCount = assetCount + 1;
    }) as ChangeEventHandler<HTMLInputElement>;

    let fileDropInput: HTMLInputElement;
</script>

<svelte:head>
    <title>Assets</title>
</svelte:head>

<main>
    <div class="head">
        <div class="flex-center" style="justify-content: start">
            <button on:click={() => fileDropInput.click()} class="primary with-icon">
                <Upload size="30" />
                Upload
            </button>
            <input
                type="file"
                on:change={upload}
                bind:this={fileDropInput}
                style="display: none"
                accept="image/png, image/jpeg, image/jpg, image/webp"
            />
        </div>
        <div class="flex-center" style="font-size: 40px;">
            <ImageOutline size="40" />
            <span> Gallery </span>
            {#if assetCount > 0}
                <Dot light />
                <span class="text-light">{assetCount}</span>
            {/if}
        </div>
        <div />
    </div>

    {#if assetCount === 0}
        <div class="flex-center container invisible">
            <i>No images yet</i>
        </div>
    {:else}
        <InfiniteScroller
            bind:items={assets}
            batchSize={4}
            numItems={assetCount}
            loadItems={loadMoreAssets}
            margin="{browser ? innerHeight : 1000}px"
        >
            <div class="assets">
                {#each assets as asset}
                    <Asset {...asset} on:delete={() => assetCount--} obfuscated={$obfuscated} />
                {/each}
            </div>
        </InfiniteScroller>
    {/if}
</main>

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/layout';

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

    .assets {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
    }
</style>
