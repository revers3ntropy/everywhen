<script lang="ts">
    import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
    import type { Asset as AssetController } from '../../lib/controllers/asset';
    import { obfuscated } from '../../lib/stores';
    import Asset from './Asset.svelte';

    export let data: App.PageData & {
        assets: Omit<AssetController, 'content'>[];
    };

    let numAssets = data.assets.length;
</script>

<main>
    <h1>
        <ImageOutline size="40" />
        <span>Gallery</span>
        <i>({numAssets})</i>
    </h1>
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