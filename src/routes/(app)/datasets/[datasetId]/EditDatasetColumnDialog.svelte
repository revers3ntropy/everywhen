<script lang="ts">
    import Select from '$lib/components/Select.svelte';
    import { builtInTypes } from '$lib/controllers/dataset/columnTypes';
    import type { DatasetColumn, DatasetColumnType } from '$lib/controllers/dataset/dataset';
    import { api, apiPath } from '$lib/utils/apiRequest';

    export let datasetId: string;
    export let column: DatasetColumn<unknown>;

    async function updateColumnType(columnId: string, type: DatasetColumnType<unknown>) {
        column.type = type;
        await api.put(apiPath(`/datasets/?/columns/?`, datasetId, columnId), { type });
    }

    async function updateColumnName(columnId: string, name: string) {
        column.name = name;
        await api.put(apiPath(`/datasets/?/columns/?`, datasetId, columnId), { name });
    }

    const columnTypesMap = Object.fromEntries(
        Object.keys(builtInTypes).map(key => [
            key,
            builtInTypes[key as keyof typeof builtInTypes].name
        ])
    );
    const builtInTypesAsMap = builtInTypes as Record<string, DatasetColumnType<unknown>>;
</script>

<div>
    <input bind:value={column.name} on:change={() => updateColumnName(column.id, column.name)} />

    <Select
        onChange={newType => updateColumnType(column.id, builtInTypesAsMap[newType])}
        key={column.type.id}
        options={columnTypesMap}
    />
</div>
