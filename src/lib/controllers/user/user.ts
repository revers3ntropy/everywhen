import * as server from './user.server';

export interface User {
    id: string;
    username: string;
    key: string;
}

export type RawAuth = Omit<User, 'id'>;
export type Auth = User;

export const User = {
    ...server.User
};
