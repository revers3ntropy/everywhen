<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import Select from '$lib/components/ui/Select.svelte';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { builtInTypes } from '$lib/controllers/dataset/columnTypes';
    import type { DatasetColumn, DatasetColumnType } from '$lib/controllers/dataset/dataset';
    import { dispatch } from '$lib/dataChangeEvents';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { tryDecryptText, tryEncryptText } from '$lib/utils/encryption.client.js';

    export let datasetId: string;
    export let column: DatasetColumn<unknown>;

    let newColumnNameDecrypted = tryDecryptText(column.name);
    let newColumnType = column.type;

    async function save() {
        notify.onErr(
            await api.put(apiPath(`/datasets/?/columns/?`, datasetId, column.id), {
                type: newColumnType.id,
                name: tryEncryptText(newColumnNameDecrypted)
            })
        );
        await dispatch.update('datasetCol', column, {
            ...column,
            name: tryEncryptText(newColumnNameDecrypted),
            type: newColumnType
        });
    }

    const columnTypesMap = Object.fromEntries(
        Object.keys(builtInTypes).map(key => [
            key,
            builtInTypes[key as keyof typeof builtInTypes].name
        ])
    );
    const builtInTypesAsMap = builtInTypes as Record<string, DatasetColumnType<unknown>>;

    $: areChanges =
        tryEncryptText(newColumnNameDecrypted) !== column.name || newColumnType !== column.type;
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
    <button class="button primary" disabled={!areChanges} on:click={save}>Save</button>
</div>
