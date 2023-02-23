export class User {
    public constructor (
        public id: string,
        public username: string,
        public key: string,
    ) {}
}

export type Auth = Omit<User, 'id'>;