<script lang="ts">
    import Spinner from '$lib/components/BookSpinner.svelte';
    import { api } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/utils/notifications';
    import { inview } from 'svelte-inview';
    import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
    import Dot from '$lib/components/Dot.svelte';
    import { obfuscated } from '$lib/stores';
    import { getNotificationsContext } from 'svelte-notifications';
    import Asset from './Asset.svelte';
    import type { PageData } from './$types';

    const { addNotification } = getNotificationsContext();

    export let data: PageData;

    const batchSize = 4;
    // initial are loaded from page.server.ts
    let currentOffset = data.assets.length;
    let loadingAt = null as number | null;

    let assets = data.assets;

    async function loadMoreAssets() {
        let offset = currentOffset;
        if (loadingAt === offset) {
            return;
        }
        loadingAt = offset;

        if (loadingAt >= data.assetCount) {
            return;
        }

        const res = displayNotifOnErr(
            addNotification,
            await api.get(data, `/assets`, { offset, count: batchSize })
        );

        console.log(res.assets);

        currentOffset += res.assets.length;
        assets = [...assets, ...res.assets];

        if (loadingAt === offset) {
            loadingAt = null;
        }
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
    {#if data.assetCount === 0}
        <div class="flex-center">
            <i>No images yet</i>
        </div>
    {:else}
        {#if loadingAt !== null && loadingAt < data.assetCount}
            <Spinner />
        {/if}
        <div
            use:inview={{ rootMargin: '100px' }}
            on:inview_enter={loadMoreAssets}
        />
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
    }
</style>
