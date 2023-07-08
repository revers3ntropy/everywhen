import * as server from './user.server';

export interface User {
    id: string;
    username: string;
    key: string;
    ghAccessToken: string | null;
}

export type RawAuth = Omit<User, 'id' | 'ghAccessToken'>;
export type Auth = Omit<User, 'ghAccessToken'>;

export const User = {
    ...server.User
};
