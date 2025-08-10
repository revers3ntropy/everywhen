import { v4 as UUIdv4 } from 'uuid';

export namespace UId {
    export function generate(): string {
        return UUIdv4().replace(/-/g, '');
    }
}
