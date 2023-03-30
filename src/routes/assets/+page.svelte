<script lang="ts">
    import type { Asset as AssetController } from '../../lib/controllers/asset';
    import { obfuscated } from '../../lib/stores';
    import Asset from './Asset.svelte';

    export let data: App.PageData & {
        assets: Omit<AssetController, 'content'>[];
    };

    let numAssets = data.assets.length;
</script>

<main>
    <h1>Assets ({numAssets})</h1>
    <div class="assets">
        {#each data.assets as asset}
            <Asset
                {...asset}
                auth={data}
                on:delete={() => numAssets--}
                obfuscated={$obfuscated}
            />
        {/each}
    </div>
</main>

<style lang="less">
    .assets {
        display: flex;
        flex-wrap: wrap;
    }
</style>