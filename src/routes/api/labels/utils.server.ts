import { decrypt } from "$lib/security/encryption";
import type { Label } from "$lib/types";

export function decryptLabel (
    label: Label,
    key: string
): Label {
    return {
        ...label,
        name: decrypt(label.name, key)
    };
}

export function decryptLabels (
    labels: Label[],
    key: string
): Record<string, any>[] {
    return labels.map((label) => decryptLabel(label, key));
}
