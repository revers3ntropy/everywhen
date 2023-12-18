export type Result<T, E = string> = Ok<T, E> | Err<T, E>;

interface ResultOption<T, E = string> {
    ok: boolean;

    map<R>(fn: (val: T) => R): Result<R, E>;

    mapErr<R>(fn: (err: E) => R): Result<T, R>;

    match<U, V>(mapVal: (val: T) => U, mapErr: (err: E) => V): U | V;

    pipe<R>(fn: (val: T) => Result<R, E>): Result<R, E>;
    pipeAsync<R>(fn: (val: T) => Promise<Result<R, E>>): Promise<Result<R, E>>;

    unwrap(mapErr?: (err: E) => unknown): T;

    or(fallback: T): T;

    merge(): T | E;
}

export namespace Result {
    export function ok<T, E = string>(value: T = null as T): Result<T, E> {
        return new Ok(value);
    }

    export function err<T, E = string>(error: E): Result<T, E> {
        return new Err<T, E>(error);
    }

    export function wrap<T>(fn: () => T): Result<T, unknown> {
        try {
            return Result.ok(fn());
        } catch (e: unknown) {
            return Result.err(e);
        }
    }

    export async function wrapPromise<T>(promise: Promise<T>): Promise<Result<T, unknown>> {
        try {
            return Result.ok(await promise);
        } catch (e: unknown) {
            return Result.err(e);
        }
    }

    export function collect<T, E>(iter: Iterable<Result<T, E>>): Result<T[], E> {
        const results: T[] = [];
        for (const result of iter) {
            if (!result.ok) {
                return Result.err(result.err);
            }
            results.push(result.val);
        }
        return Result.ok(results);
    }

    export async function collectAsync<T, E = string>(
        iter: Iterable<Promise<Result<T, E>>> | Promise<Result<T, E>>[]
    ): Promise<Result<T[], E>> {
        return Result.collect(
            (await Promise.allSettled(iter)).map(result => {
                if (result.status === 'fulfilled') {
                    return result.value;
                } else {
                    return Result.err(result.reason);
                }
            })
        );
    }

    export function filter<T, E = string>(iter: Iterable<Result<T, E>>): [T[], E[]] {
        const results: T[] = [];
        const errors: E[] = [];
        for (const result of iter) {
            result.match(
                val => results.push(val),
                err => errors.push(err)
            );
        }
        return [results, errors];
    }

    export async function filterAsync<T, E = string>(
        iter: Iterable<Promise<Result<T, E>>> | Promise<Result<T, E>>[]
    ): Promise<[T[], E[]]> {
        return Result.filter(
            (await Promise.allSettled(iter)).map(result => {
                if (result.status === 'fulfilled') {
                    return result.value;
                } else {
                    return Result.err(result.reason);
                }
            })
        );
    }
}

class Ok<T, E> implements ResultOption<T, E> {
    public ok = true as const;
    public constructor(public readonly val: T) {}

    public map<R = T>(fn: (_val: T) => R): Result<R, E> {
        return Result.ok(fn(this.val));
    }

    public mapErr<R>(_fn: (_err: E) => R): Result<T, R> {
        return this as unknown as Result<T, R>;
    }

    public pipe<R>(fn: (_val: T) => Result<R, E>): Result<R, E> {
        return fn(this.val);
    }

    public pipeAsync<R>(fn: (_val: T) => Promise<Result<R, E>>): Promise<Result<R, E>> {
        return fn(this.val);
    }

    public match<U, V>(mapVal: (_val: T) => U, _: (_err: E) => V): U {
        return mapVal(this.val);
    }

    public unwrap(_mapErr?: (err: E) => unknown): T {
        return this.val;
    }

    public or(_: T): T {
        return this.val;
    }

    public merge(): T | E {
        return this.val;
    }

    public cast<E>(): Result<T, E> {
        return new Ok<T, E>(this.val);
    }
}

class Err<T, E> implements ResultOption<unknown, E> {
    public ok = false as const;
    public constructor(public readonly err: E) {}

    public map<R>(_fn: (_val: T) => R): Result<R, E> {
        return this as unknown as Result<R, E>;
    }

    public mapErr<R>(fn: (_err: E) => R): Result<T, R> {
        return Result.err(fn(this.err));
    }

    public pipe<R = T>(_fn: (_val: T) => Result<R, E>): Result<R, E> {
        return this as unknown as Result<R, E>;
    }

    public pipeAsync<R>(_fn: (_val: T) => Promise<Result<R, E>>): Promise<Result<R, E>> {
        return Promise.resolve(this as unknown as Result<R, E>);
    }

    public match<U, V>(_: (_val: T) => U, mapErr: (_err: E) => V): V {
        return mapErr(this.err);
    }

    public unwrap(map?: (err: E) => unknown): T {
        throw map ? map(this.err) : this.err;
    }

    public or(fallback: T): T {
        return fallback;
    }

    public merge(): T | E {
        return this.err;
    }

    public cast<T>(): Result<T, E> {
        return new Err<T, E>(this.err);
    }
}
