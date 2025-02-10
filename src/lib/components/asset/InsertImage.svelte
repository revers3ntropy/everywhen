<script lang="ts">
    import InfiniteScroller from '$lib/components/ui/InfiniteScroller.svelte';
    import { FILE_INPUT_ACCEPT_TYPES } from '$lib/constants';
    import { Asset, type AssetMetadata } from '$lib/controllers/asset/asset';
    import { notify } from '$lib/components/notifications/notifications';
    import { dispatch, listen } from '$lib/dataChangeEvents';
    import { api } from '$lib/utils/apiRequest';
    import { Result } from '$lib/utils/result';
    import { nowUtc } from '$lib/utils/time';
    import { onMount } from 'svelte';
    import ImageArea from 'svelte-material-icons/ImageArea.svelte';
    import FolderMultipleImage from 'svelte-material-icons/FolderMultipleImage.svelte';
    import Upload from 'svelte-material-icons/Upload.svelte';
    import Dropdown from '$lib/components/ui/Dropdown.svelte';
    import type { ChangeEventHandler } from 'svelte/elements';

    export let size = '30';
    // should NOT trigger a 'create' event
    export let onInput: (markdown: string) => void;

    async function loadMoreAssets(): Promise<void> {
        const res = notify.onErr(await api.get(`/assets`, { offset: assets.length, count: 4 }));
        assetCount = res.assetCount;
        assets = [...assets, ...res.assets];
    }

    const upload = (async e => {
        if (e.target === null || !('files' in e.target)) {
            return;
        }
        const files = e.target.files as FileList;
        const [uploadedImages, errors] = Result.filter(await Asset.uploadImages(files));

        notify.error(errors);

        for (const { publicId, fileName, id } of uploadedImages) {
            onInput(Asset.generateMarkdownLink(fileName, publicId));
            await dispatch.create('asset', { id, created: nowUtc(), publicId, fileName });
        }
        closePopup();
    }) as ChangeEventHandler<HTMLInputElement>;

    onMount(async () => {
        await loadMoreAssets();
    });

    listen.asset.onCreate(asset => {
        assets = [asset, ...assets];
        assetCount++;
    });
    listen.asset.onDelete(assetId => {
        assets = assets.filter(a => a.id !== assetId);
        assetCount--;
    });
    listen.asset.onUpdate(asset => {
        // no emitters for update events yet,
        // not sure why there ever would be...
        const index = assets.findIndex(a => a.id === asset.id);
        if (index !== -1) assets[index] = asset;
    });

    let closePopup: () => void;
    let fileDropInput: HTMLInputElement;
    let assets = [] as AssetMetadata[];
    let assetCount = Infinity;
</script>

<div>
    <Dropdown openOnHover fillWidthMobile stayOpenWhenClicked bind:close={closePopup}>
        <span slot="button">
            <ImageArea {size} />
        </span>
        <div>
            <button
                on:click={() => fileDropInput.click()}
                class="flex items-center hover:bg-vLightAccent icon-gradient-on-hover p-3 gap-3 w-full rounded-2xl"
            >
                <Upload size="28" />
                Upload Image
            </button>
            <input
                type="file"
                on:change={upload}
                bind:this={fileDropInput}
                style="display: none"
                multiple
                accept={FILE_INPUT_ACCEPT_TYPES}
            />

            <a href="/assets">
                <button class="flex p-3 items-center gap-3">
                    <FolderMultipleImage size="28" />
                    Gallery
                </button>
            </a>

            <hr />

            <div style="width: 300px; max-height: 500px" class="overflow-y-auto">
                <div class="relative">
                    {#if assetCount > -1 && assets.length}
                        <InfiniteScroller
                            loadItems={loadMoreAssets}
                            hasMore={() => assets.length < assetCount}
                            margin={100}
                        >
                            {#each assets as asset}
                                <button
                                    class="asset"
                                    on:click={() => {
                                        onInput(
                                            Asset.generateMarkdownLink(
                                                asset.fileName,
                                                asset.publicId
                                            )
                                        );
                                        closePopup();
                                    }}
                                >
                                    <img
                                        src="/api/assets/{asset.publicId}"
                                        alt={asset.fileName}
                                        loading="lazy"
                                    />
                                </button>
                            {/each}
                        </InfiniteScroller>
                    {:else}
                        <div class="text-light m-4"> No images in gallery yet </div>
                    {/if}
                </div>
            </div>
        </div>
    </Dropdown>
</div>

<style lang="scss">
    .asset {
        &:hover {
            filter: brightness(0.85);
        }
    }
</style>
