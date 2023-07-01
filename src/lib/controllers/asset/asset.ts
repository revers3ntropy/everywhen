import * as server from './asset.server';
import * as client from './asset.client';

export interface Asset {
    id: string;
    publicId: string;
    content: string;
    fileName: string;
    contentType: string;
    created: number;
}

export const Asset = {
    ...server.Asset,
    ...client.Asset
};
