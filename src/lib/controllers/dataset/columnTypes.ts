import type { DatasetColumnType } from '$lib/controllers/dataset/dataset';

export const builtInTypes = {
    number: {
        id: 'number',
        created: null,
        name: 'Number',
        unit: '',
        validate: (value: unknown): value is number => typeof value === 'number'
    },
    nullableNumber: {
        id: 'nullable number',
        created: null,
        name: 'Number',
        unit: '',
        validate: (value: unknown): value is number | null =>
            typeof value === 'number' || value === null
    },
    text: {
        id: 'text',
        created: null,
        name: 'Text',
        unit: '',
        validate: (value: unknown): value is string => typeof value === 'string'
    },
    boolean: {
        id: 'boolean',
        created: null,
        name: 'Boolean',
        unit: '',
        validate: (value: unknown): value is boolean => typeof value === 'boolean'
    }
} satisfies Record<string, DatasetColumnType<unknown>>;
