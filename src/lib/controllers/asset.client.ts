import type { Asset as _Asset } from './asset';
export type Asset = _Asset;

namespace AssetUtils {
    export function jsonIsRawAsset(json: unknown): json is Omit<Asset, 'id'> {
        return (
            typeof json === 'object' &&
            json !== null &&
            'publicId' in json &&
            typeof json.publicId === 'string' &&
            'content' in json &&
            typeof json.content === 'string' &&
            'fileName' in json &&
            typeof json.fileName === 'string' &&
            'contentType' in json &&
            typeof json.contentType === 'string' &&
            'created' in json &&
            typeof json.created === 'number'
        );
    }

    export function mdLink(fileName: string, publicId: string): string {
        return `![${fileName}](/api/assets/${publicId})`;
    }
}

export const Asset = AssetUtils;
