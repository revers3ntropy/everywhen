import type { Dataset as _Dataset, ThirdPartyDatasetIds, DatasetColumnType } from './dataset';

export type Dataset = _Dataset;

namespace DatasetUtils {
    export const builtInTypes: DatasetColumnType[] = [
        {
            id: 'number',
            created: null,
            name: 'Number',
            unit: ''
        },
        {
            id: 'weight_kg',
            created: null,
            name: 'Weight (KG)',
            unit: 'kg'
        },
        {
            id: 'text',
            created: null,
            name: 'Text',
            unit: ''
        },
        {
            id: 'boolean',
            created: null,
            name: 'Boolean',
            unit: ''
        }
    ];

    type Preset = { columns: { name: string; type: string }[] };
    export const dataSetPresets = {
        Weight: {
            columns: [{ name: 'Weight', type: 'weight_kg' }]
        }
    } satisfies { [name: string]: Preset };

    export const thirdPartyDatasetIdsToNames: Record<ThirdPartyDatasetIds, string> = {
        githubCommits: 'GitHub Commits',
        githubLoC: 'GitHub LoC'
    };
}

export type DatasetPresetName = keyof typeof DatasetUtils.dataSetPresets;

export const Dataset = DatasetUtils;
