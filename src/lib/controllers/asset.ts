import { Controller } from './controller';

export class Asset<T = string> extends Controller {
    public constructor (
        public id: string,
        public raw: T,
        public created: number,
    ) {
        super();
    }
}