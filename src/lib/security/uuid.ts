import { v4 as UUIdv4 } from 'uuid';

export async function generateUUId(type: string): Promise<string> {
    return `misc_3-${type}-${UUIdv4()}`;
}