<script lang="ts">
    import { onMount } from 'svelte';
    import type { ChangeEventHandler } from 'svelte/elements';
    import ImageArea from 'svelte-material-icons/ImageArea.svelte';
    import Upload from 'svelte-material-icons/Upload.svelte';
    import FolderMultipleImage from 'svelte-material-icons/FolderMultipleImage.svelte';
    import InfiniteScroller from '$lib/components/ui/InfiniteScroller.svelte';
    import { FILE_INPUT_ACCEPT_TYPES } from '$lib/constants';
    import { Asset, type AssetMetadata } from '$lib/controllers/asset/asset';
    import { notify } from '$lib/components/notifications/notifications';
    import { dispatch, listen } from '$lib/dataChangeEvents';
    import { api } from '$lib/utils/apiRequest';
    import { Result } from '$lib/utils/result';
    import { nowUtc } from '$lib/utils/time';
    import * as Popover from '$lib/components/ui/popover';
    import { cn } from '$lib/utils';
    import { buttonVariants } from '$lib/components/ui/button';
    import Image from '$lib/components/asset/Image.svelte';
    import { tryDecryptText } from '$lib/utils/encryption.client.js';

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
        popoverOpen = false;
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

    let fileDropInput: HTMLInputElement;
    let assets = [] as AssetMetadata[];
    let assetCount = Infinity;
    let popoverOpen = false;
</script>

<Popover.Root bind:open={popoverOpen}>
    <Popover.Trigger
        class={cn(
            buttonVariants({ variant: 'outline' }),
            'bg-transparent px-2 text-md gap-1 hover:bg-vLightAccent rounded-full hover:text-textColor'
        )}
    >
        <ImageArea {size} />
    </Popover.Trigger>
    <Popover.Content class="w-fit py-2 px-0">
        <button
            on:click={() => fileDropInput.click()}
            class="flex items-center hover:bg-vLightAccent p-2 gap-3 w-full"
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
            <button class="flex items-center hover:bg-vLightAccent p-2 gap-3 w-full">
                <FolderMultipleImage size="28" />
                Gallery
            </button>
        </a>

        <div class="overflow-y-auto w-[300px] max-h-[500px] pt-4">
            <div class="relative">
                {#if assetCount > -1 && assets.length}
                    <InfiniteScroller
                        loadItems={loadMoreAssets}
                        hasMore={() => assets.length < assetCount}
                        margin={100}
                    >
                        {#each assets as asset}
                            <button
                                class="asset hover:brightness-75"
                                on:click={() => {
                                    onInput(
                                        Asset.generateMarkdownLink(
                                            tryDecryptText(asset.fileName),
                                            asset.publicId
                                        )
                                    );
                                    popoverOpen = false;
                                }}
                            >
                                <Image
                                    publicId={asset.publicId}
                                    id={asset.id}
                                    fileName={asset.fileName}
                                />
                            </button>
                        {/each}
                    </InfiniteScroller>
                {:else}
                    <div class="text-light m-4"> No images in gallery yet </div>
                {/if}
            </div>
        </div>
    </Popover.Content>
</Popover.Root>
