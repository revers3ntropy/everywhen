import { notify } from '$lib/components/notifications/notifications';
import type { PresetId } from '$lib/controllers/dataset/presets';
import { datasetPresets } from '$lib/controllers/dataset/presets';
import { dispatch } from '$lib/dataChangeEvents';
import { api } from '$lib/utils/apiRequest';
import { Result } from '$lib/utils/result';
import { nowUtc } from '$lib/utils/time';

export async function makeFromPreset(presetId: PresetId): Promise<Result<string>> {
    const preset = datasetPresets[presetId];
    if (!preset) {
        return Result.err('Invalid preset');
    }
    const res = await api.post('/datasets', {
        name: datasetPresets[presetId].defaultName,
        presetId
    });
    if (!res.ok) return res.cast();
    const { id } = res.val;

    await dispatch.create('dataset', {
        id,
        preset,
        name: datasetPresets[presetId].defaultName,
        columns: preset.columns,
        created: nowUtc(),
        rowCount: 0
    });

    notify.success('Dataset created');

    return Result.ok(id);
}

export async function makeBlank(usedNames: string[]): Promise<string> {
    let name = 'Blank';

    let i = 1;
    while (usedNames.includes(name)) {
        name = `Blank ${i}`;
        i++;
    }

    const { id } = notify.onErr(
        await api.post('/datasets', {
            name,
            presetId: null
        })
    );

    await dispatch.create('dataset', {
        id,
        preset: null,
        name,
        columns: [],
        rowCount: 0,
        created: nowUtc()
    });

    notify.success('Dataset created');

    return id;
}
