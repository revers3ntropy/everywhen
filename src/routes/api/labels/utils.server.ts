import { decrypt } from "$lib/security/encryption";

export function decryptLabel(label: Record<string, any>, key: string): Record<string, any> {
    return {
        ...label,
        name: decrypt(label.name, key)
    };
}

export function decryptLabels(labels: Record<string, any>[], key: string): Record<string, any>[] {
    return labels.map((label) => decryptLabel(label, key));
}