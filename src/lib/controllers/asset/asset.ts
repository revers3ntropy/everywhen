import * as server from './asset.server';
import * as client from './asset.client';

export interface Asset {
    id: string;
    publicId: string;
    content: string;
    fileName: string;
    created: number;
}

export type AssetMetadata = Omit<Asset, 'content'>;

export const Asset = {
    ...server.Asset,
    ...client.Asset
};
