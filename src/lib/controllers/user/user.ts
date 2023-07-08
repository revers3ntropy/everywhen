import * as server from './user.server';

export interface User {
    id: string;
    username: string;
    key: string;
    ghAccessToken?: string;
}

export type RawAuth = Omit<User, 'id'>;
export type Auth = Omit<User, 'ghAccessToken'>;

export const User = {
    ...server.User
};
