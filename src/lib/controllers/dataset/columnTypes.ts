import type { DatasetColumnType } from '$lib/controllers/dataset/dataset';

export const builtInTypes = {
    number: {
        id: 'number',
        created: null,
        name: 'Number',
        unit: '',
        defaultValue: 0,
        validate: (value: unknown): value is number => typeof value === 'number',
        castTo: (value: unknown) => {
            const v = Number(value);
            if (!isNaN(v)) return v;
            return 0;
        }
    },
    nullableNumber: {
        id: 'nullableNumber',
        created: null,
        name: 'Number',
        unit: '',
        defaultValue: null,
        validate: (value: unknown): value is number | null =>
            typeof value === 'number' || value === null,
        castTo: (value: unknown) => {
            const v = Number(value);
            if (!isNaN(v)) return v;
            return null;
        }
    },
    text: {
        id: 'text',
        created: null,
        name: 'Text',
        unit: '',
        defaultValue: '',
        validate: (value: unknown): value is string => typeof value === 'string',
        castTo: (value: unknown) => String(value)
    },

    boolean: {
        id: 'boolean',
        created: null,
        name: 'Boolean',
        unit: '',
        defaultValue: false,
        validate: (value: unknown): value is boolean => typeof value === 'boolean',
        castTo: (value: unknown) => !!value
    }
} satisfies Record<string, DatasetColumnType<unknown>>;
