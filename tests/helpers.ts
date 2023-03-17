import { sha256 } from 'js-sha256';
import { api } from '../src/lib/api/apiQuery';
import type { Auth } from '../src/lib/controllers/user';
import { Result } from '../src/lib/utils';

function randStr (
    length = 10,
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz',
): string {
    let result = ' ';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

export async function generateUser (): Promise<Result<Auth & { password: string }>> {
    const username = randStr();
    const password = randStr();

    const key = sha256(password).substring(0, 32);

    const { err } = await api.post({} as Auth, '/users', {
        username,
        password: key,
    });
    if (err) return Result.err(err);

    const { err: authErr, val: user } = await api.get({} as Auth, '/auth', {
        username, key,
    });
    if (authErr) return Result.err(authErr);

    return Result.ok({
        key,
        username,
        password,
        id: user.id,
    });
}

export async function deleteUser (auth: Auth): Promise<Result> {
    const { err } = await api.delete(auth, '/users');
    if (err) return Result.err(err);
    return Result.ok(null);
}