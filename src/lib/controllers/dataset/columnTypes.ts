import type { DatasetColumnType } from '$lib/controllers/dataset/dataset';

export const builtInTypes = {
    number: {
        id: 'number',
        created: null,
        name: 'Number',
        unit: '',
        validate: (value: unknown) => typeof value === 'number'
    },
    text: {
        id: 'text',
        created: null,
        name: 'Text',
        unit: '',
        validate: (value: unknown) => typeof value === 'string'
    },
    boolean: {
        id: 'boolean',
        created: null,
        name: 'Boolean',
        unit: '',
        validate: (value: unknown) => typeof value === 'boolean'
    }
} satisfies Record<string, DatasetColumnType<unknown>>;
