import { Dataset } from '$lib/controllers/dataset/dataset';
import type { DatasetColumnType } from '$lib/controllers/dataset/dataset';

export interface DatasetPreset {
    id: string;
    columns: { name: string; type: DatasetColumnType<unknown> }[];
}

export const datasetPresets = {
    weight: {
        id: 'weight',
        columns: [{ name: 'Weight', type: Dataset.builtInTypes.number }]
    }
} satisfies { [name: string]: DatasetPreset };
