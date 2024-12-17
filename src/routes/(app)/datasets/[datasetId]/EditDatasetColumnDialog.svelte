<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import Select from '$lib/components/Select.svelte';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { builtInTypes } from '$lib/controllers/dataset/columnTypes';
    import type { DatasetColumn, DatasetColumnType } from '$lib/controllers/dataset/dataset';
    import { dispatch } from '$lib/dataChangeEvents';
    import { popup } from '$lib/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';

    export let datasetId: string;
    export let column: DatasetColumn<unknown>;

    let newColumnName = column.name;
    let newColumnType = column.type;

    async function save() {
        notify.onErr(
            await api.put(apiPath(`/datasets/?/columns/?`, datasetId, column.id), {
                type: newColumnType.id,
                name: newColumnName
            })
        );
        await dispatch.update('datasetCol', column, {
            ...column,
            name: newColumnName,
            type: newColumnType
        });
        $popup = null;
    }

    const columnTypesMap = Object.fromEntries(
        Object.keys(builtInTypes).map(key => [
            key,
            builtInTypes[key as keyof typeof builtInTypes].name
        ])
    );
    const builtInTypesAsMap = builtInTypes as Record<string, DatasetColumnType<unknown>>;

    $: areChanges = newColumnName !== column.name || newColumnType !== column.type;
</script>

<div>
    <Textbox bind:value={newColumnName} label="Name" />
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
