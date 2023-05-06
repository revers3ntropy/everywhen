<script lang="ts">
    import InfiniteScroller from '$lib/components/InfiniteScroller.svelte';
    import { api } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/notifications/notifications';
    import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
    import Dot from '$lib/components/Dot.svelte';
    import { obfuscated } from '$lib/stores';
    import Asset from './Asset.svelte';
    import type { Asset as AssetController } from '$lib/controllers/asset';
    import type { PageData } from './$types';

    export let data: PageData;

    let assets = data.assets;

    async function loadMoreAssets(
        offset: number,
        count: number
    ): Promise<Omit<AssetController, 'content'>[]> {
        const res = displayNotifOnErr(
            await api.get(data, `/assets`, { offset, count })
        );
        return res.assets;
    }
</script>

<main>
    <h1>
        <ImageOutline size="40" />
        <span>Gallery</span>
        {#if data.assetCount > 0}
            <Dot light />
            <span class="text-light">{data.assetCount}</span>
        {/if}
    </h1>

    {#if data.assetCount === 0}
        <div class="flex-center container invisible">
            <i>No images yet</i>
        </div>
    {:else}
        <InfiniteScroller
            bind:items={assets}
            batchSize={4}
            numItems={data.assetCount}
            loadItems={loadMoreAssets}
        >
            <div class="assets">
                {#each assets as asset}
                    <Asset
                        {...asset}
                        auth={data}
                        on:delete={() => data.assetCount--}
                        obfuscated={$obfuscated}
                    />
                {/each}
            </div>
        </InfiniteScroller>
    {/if}
</main>

<style lang="less">
    @import '../../styles/variables';
    @import '../../styles/layout';

    h1 {
        .flex-center();
        margin: 0;
        font-size: 40px;

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
