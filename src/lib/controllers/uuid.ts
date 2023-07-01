import * as server from './uuid.server';

export type UUId = string;

export const UUId = {
    ...server.UUId
};
