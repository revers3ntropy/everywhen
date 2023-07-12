<script lang="ts">
    import { uploadImage } from '$lib/components/asset/uploadImage';
    import InfiniteScroller from '$lib/components/InfiniteScroller.svelte';
    import type { Auth } from '$lib/controllers/user/user';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';
    import { nowUtc } from '$lib/utils/time';
    import { onMount } from 'svelte';
    import ImageArea from 'svelte-material-icons/ImageArea.svelte';
    import Upload from 'svelte-material-icons/Upload.svelte';
    import Dropdown from '$lib/components/Dropdown.svelte';
    import type { ChangeEventHandler } from 'svelte/elements';
    import { Asset } from '$lib/controllers/asset/asset.client';

    export let auth: Auth;
    export let size = '30';
    export let onInput: (markdown: string) => void;

    async function loadMoreAssets(
        offset: number,
        count: number
    ): Promise<Omit<Asset, 'content'>[]> {
        const res = displayNotifOnErr(await api.get(auth, `/assets`, { offset, count }));
        assetCount = res.assetCount;
        return res.assets;
    }

    const upload = (async e => {
        if (e.target === null || !('files' in e.target)) {
            return;
        }
        const files = e.target.files as FileList;
        const res = await uploadImage(auth, files);
        if (res === null) return;
        const { publicId, fileName, id } = res;
        assets = [
            {
                id,
                publicId,
                fileName,
                created: nowUtc()
            },
            ...assets
        ];
        onInput(Asset.mdLink(fileName, publicId));
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
            <button on:click={() => fileDropInput.click()} class="with-icon upload-button">
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
                                    onInput(Asset.mdLink(asset.fileName, asset.publicId));
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
                {/if}
            </div>
        </div>
    </Dropdown>
</div>

<style lang="less">
    .dropdown-contents {
        .upload-button {
            width: 100%;
            padding: 4px;
            margin: 1rem 0 0 0;
            text-align: left;

            &:hover {
                background-color: var(--v-light-accent);
            }
        }

        .asset {
            &:hover {
                filter: brightness(0.85);
            }
        }
    }
</style>
