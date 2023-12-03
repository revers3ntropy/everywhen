import { notify } from '$lib/components/notifications/notifications';
import type { PresetId } from '$lib/controllers/dataset/presets';
import { datasetPresets } from '$lib/controllers/dataset/presets';
import { api } from '$lib/utils/apiRequest';

export async function makeFromPreset(presetId: PresetId): Promise<string> {
    return notify.onErr(
        await api.post('/datasets', {
            name: datasetPresets[presetId].defaultName,
            presetId
        })
    ).id;
}
