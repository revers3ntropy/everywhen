import type { Label as _Label } from './label';
export type Label = _Label;

namespace LabelUtils {
    export function jsonIsRawLabel(label: unknown): label is Omit<Label, 'id'> {
        return (
            typeof label === 'object' &&
            label !== null &&
            'color' in label &&
            typeof label.color === 'string' &&
            'name' in label &&
            typeof label.name === 'string' &&
            'created' in label &&
            typeof label.created === 'number'
        );
    }
}

export const Label = LabelUtils;
