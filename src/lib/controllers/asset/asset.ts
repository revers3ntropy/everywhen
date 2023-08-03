export interface IAsset {
    id: string;
    publicId: string;
    content: string;
    fileName: string;
    created: number;
}

export type AssetMetadata = Omit<IAsset, 'content'>;

export namespace AssetControllerClient {
    export function generateMarkdownLink(fileName: string, publicId: string): string {
        return `![${fileName}](/api/assets/${publicId})`;
    }
}
