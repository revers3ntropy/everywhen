import type { DatasetColumnType } from '$lib/controllers/dataset/dataset';

export const builtInTypes = {
    number: {
        id: 'number',
        created: null,
        name: 'Number',
        unit: '',
        validate: (value: unknown) => typeof value === 'number',
        serialize: JSON.stringify,
        deserialize: JSON.parse
    },
    text: {
        id: 'text',
        created: null,
        name: 'Text',
        unit: '',
        validate: (value: unknown) => typeof value === 'string',
        serialize: t => t as string,
        deserialize: t => t
    },
    boolean: {
        id: 'boolean',
        created: null,
        name: 'Boolean',
        unit: '',
        validate: (value: unknown) => typeof value === 'boolean',
        serialize: (value: unknown) => (value ? '1' : '0'),
        deserialize: (value: string) => value === '1'
    }
} satisfies Record<string, DatasetColumnType<unknown>>;
