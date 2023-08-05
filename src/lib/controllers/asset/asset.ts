export interface Asset {
    id: string;
    publicId: string;
    content: string;
    fileName: string;
    created: number;
}

export type AssetMetadata = Omit<Asset, 'content'>;

export namespace Asset {
    export function generateMarkdownLink(fileName: string, publicId: string): string {
        return `![${fileName}](/api/assets/${publicId})`;
    }
}
