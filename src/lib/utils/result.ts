export type Result<T, E = string> = Ok<T, E> | Err<T, E>;

interface ResultOption<T, E = string> {
    ok: boolean;

    // `maps` the value if there is one, but leaves the error along
    map<R>(fn: (val: T) => R): Result<R, E>;

    // other way round: applies a function to the error is there is one
    mapErr<R>(fn: (err: E) => R): Result<T, R>;

    // convert from `Result`s to `throw`s
    // (convert the other way round with static `Result.wrap`)
    unwrap(mapErr?: (err: E) => unknown): T;

    // returns the value if it has one, or the argument otherwise
    or(_fallback: T): T;

    // returns whatever data it holds, be it error or value
    merge(): T | E;
}

export namespace Result {
    // Create new `Ok` variant.
    // The reason the Ok variant is not exposed directly is that
    // `Result.ok(value)` is just a little clearer than `new Ok(value)` in my opinion,
    // although both are very reasonable.
    export function ok<T, E = string>(value: T = null as T): Result<T, E> {
        return new Ok(value);
    }

    // Create new `Err` variant.
    export function err<T, E = string>(error: E): Result<T, E> {
        return new Err<T, E>(error);
    }

    // convert from traditional JS `throw` to `Result`
    export function wrap<T>(fn: () => T): Result<T, unknown> {
        try {
            return Result.ok(fn());
        } catch (e: unknown) {
            return Result.err(e);
        }
    }

    // Async equivalent for `wrap`
    export async function wrapAsync<T>(promise: Promise<T>): Promise<Result<T, unknown>> {
        try {
            return Result.ok(await promise);
        } catch (e: unknown) {
            return Result.err(e);
        }
    }

    // Extracts the first Err variant if there is one, and otherwise returns the array as the `val`s of each element,
    // Especially useful if you are `map`ing over an array and need to return a `Result` inside the map.
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
        iter: Iterable<Promise<Result<T, E>>>
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

    // Converts an array of `Result`s into two arrays of the combined `val`s and `err`s.
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
}

class Ok<T, E> implements ResultOption<T, E> {
    // The `as const` part is the real magic:
    // Typescript will now know that if `myResult.ok` is true, then it must be the `Ok` variant
    // of a `Result` and not the `Err` variant.
    public ok = true as const;
    public constructor(public readonly val: T) {}

    public map<R = T>(fn: (_val: T) => R): Result<R, E> {
        return Result.ok(fn(this.val));
    }

    public mapErr<R = E>(_fn: (_err: E) => R): Result<T, R> {
        return this as unknown as Result<T, R>;
    }

    public match<U = T, V = E>(mapVal: (_val: T) => U, _: (_err: E) => V): U {
        return mapVal(this.val);
    }

    public transform<U = T, V = E>(mapVal: (_val: T) => U, _?: (_err: E) => V): Result<U, V> {
        return Result.ok(mapVal(this.val));
    }

    public async transformAsync<U = T, V = E>(
        mapVal: (_val: T) => Promise<U>,
        _?: (_err: E) => Promise<V>
    ): Promise<Result<U, V>> {
        return Result.ok(await mapVal(this.val));
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

    public as<E>(): Result<T, E> {
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

    public as<T>(): Result<T, E> {
        return new Err<T, E>(this.err);
    }
}
