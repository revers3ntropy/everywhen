<script lang="ts">
    import { slide } from 'svelte/transition';
    import Select from '$lib/components/ui/Select.svelte';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { builtInTypes } from '$lib/controllers/dataset/columnTypes';
    import type {
        DatasetColumn,
        DatasetColumnType,
        DecryptedDatasetRow
    } from '$lib/controllers/dataset/dataset';
    import { tryDecryptText, tryEncryptText } from '$lib/utils/encryption.client.js';
    import { updateDatasetColumn } from './datasetActions.client';
    import { ANIMATION_DURATION } from '$lib/constants';

    export let datasetId: string;
    export let columns: DatasetColumn<unknown>[];
    export let column: DatasetColumn<unknown>;
    export let decryptedRows: DecryptedDatasetRow[];

    async function update() {
        error = undefined;
        const res = await updateDatasetColumn(
            datasetId,
            columns,
            column,
            decryptedRows,
            newColumnType,
            newColumnNameDecrypted
        );
        if (!res.ok) error = res.err;
    }

    let newColumnNameDecrypted = tryDecryptText(column.name);
    let newColumnType = column.type;

    const columnTypesMap = Object.fromEntries(
        Object.keys(builtInTypes).map(key => [
            key,
            builtInTypes[key as keyof typeof builtInTypes].name
        ])
    );
    const builtInTypesAsMap = builtInTypes as Record<string, DatasetColumnType<unknown>>;

    $: areChanges =
        tryEncryptText(newColumnNameDecrypted) !== column.name || newColumnType !== column.type;

    let error: string | undefined;
</script>

<div>
    <Textbox bind:value={newColumnNameDecrypted} label="Name" />
</div>
<div class="pt-4">
    <p>Type</p>
    <Select
        onChange={newType => (newColumnType = builtInTypesAsMap[newType])}
        key={newColumnType.id}
        options={columnTypesMap}
    />
</div>
<div class="pt-4">
    <button class="button primary" disabled={!areChanges} on:click={update}> Save </button>
</div>
{#if error}
    <div class="pt-4" transition:slide={{ axis: 'y', duration: ANIMATION_DURATION }}>
        <p class="text-destructive-foreground bg-destructive p-2 rounded-xl">
            {error}
        </p>
    </div>
{/if}
