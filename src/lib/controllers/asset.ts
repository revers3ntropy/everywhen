export class Asset <T=string> {
    public constructor (
        public id: string,
        public raw: T,
        public created: number,
    ) {}
}