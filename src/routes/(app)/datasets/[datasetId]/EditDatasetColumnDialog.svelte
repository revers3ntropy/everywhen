<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import Select from '$lib/components/Select.svelte';
    import { builtInTypes } from '$lib/controllers/dataset/columnTypes';
    import type { DatasetColumn, DatasetColumnType } from '$lib/controllers/dataset/dataset';
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

<form>
    <div>
        <p class="form-label">Name</p>
        <input bind:value={newColumnName} />
    </div>
    <div class="spacer" />
    <div>
        <p class="form-label">Type</p>
        <Select
            onChange={newType => (newColumnType = builtInTypesAsMap[newType])}
            key={newColumnType.id}
            options={columnTypesMap}
        />
    </div>
    <div class="spacer" />
    <div>
        <button class="button" disabled={!areChanges} on:click={save}>Save</button>
    </div>
</form>
