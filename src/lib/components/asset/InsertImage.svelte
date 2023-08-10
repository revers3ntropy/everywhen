<script lang="ts">
    import { uploadImages } from '$lib/components/asset/uploadImages';
    import InfiniteScroller from '$lib/components/InfiniteScroller.svelte';
    import { FILE_INPUT_ACCEPT_TYPES } from '$lib/constants';
    import { Asset } from '$lib/controllers/asset/asset';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';
    import { nowUtc } from '$lib/utils/time';
    import { onMount } from 'svelte';
    import ImageArea from 'svelte-material-icons/ImageArea.svelte';
    import Upload from 'svelte-material-icons/Upload.svelte';
    import Dropdown from '$lib/components/Dropdown.svelte';
    import type { ChangeEventHandler } from 'svelte/elements';

    export let size = '30';
    export let onInput: (markdown: string) => void;

    async function loadMoreAssets(
        offset: number,
        count: number
    ): Promise<Omit<Asset, 'content'>[]> {
        const res = displayNotifOnErr(await api.get(`/assets`, { offset, count }));
        assetCount = res.assetCount;
        return res.assets;
    }

    const upload = (async e => {
        if (e.target === null || !('files' in e.target)) {
            return;
        }
        const files = e.target.files as FileList;
        const res = await uploadImages(files);
        if (res === null) return;
        assets = [
            ...res.map(({ id, publicId, fileName }) => ({
                id,
                publicId,
                fileName,
                created: nowUtc()
            })),
            ...assets
        ];
        for (const { publicId, fileName } of res) {
            onInput(Asset.generateMarkdownLink(fileName, publicId));
        }
        closePopup();
    }) as ChangeEventHandler<HTMLInputElement>;

    onMount(async () => {
        assets = await loadMoreAssets(0, 10);
    });

    let closePopup: () => void;
    let fileDropInput: HTMLInputElement;
    let assets = [] as Omit<Asset, 'content'>[];
    let assetCount = -1;
</script>

<div>
    <Dropdown openOnHover fillWidthMobile stayOpenWhenClicked bind:close={closePopup}>
        <span slot="button">
            <ImageArea {size} />
        </span>
        <div style="padding: 1rem 0">
            <button
                on:click={() => fileDropInput.click()}
                class="with-icon upload-button icon-gradient-on-hover"
            >
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

            <hr />

            <div style="width: 300px; max-height: 500px; overflow-y: scroll">
                {#if assetCount > -1 && assets.length}
                    <InfiniteScroller
                        bind:items={assets}
                        batchSize={4}
                        numItems={assetCount}
                        loadItems={loadMoreAssets}
                        margin="100px"
                    >
                        {#each assets as asset}
                            <button
                                class="asset"
                                on:click={() => {
                                    onInput(
                                        Asset.generateMarkdownLink(asset.fileName, asset.publicId)
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
                    <div class="text-light" style="margin: 1rem"> No images in gallery yet </div>
                {/if}
            </div>
        </div>
    </Dropdown>
</div>

<style lang="less">
    .asset {
        &:hover {
            filter: brightness(0.85);
        }
    }

    .upload-button {
        width: 100%;
        padding: 4px;
        margin: 0;
        text-align: left;

        &:hover {
            background-color: var(--v-light-accent);
        }
    }
</style>
