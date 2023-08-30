type ErrorDefault = string;

export class Result<T, E = ErrorDefault> {
    protected constructor(
        public readonly ok: boolean,
        private readonly valOrErr: T | E
    ) {}

    public match<U, V>(
        ok: (value: T) => U,
        err: (error: E) => V,
        either: (valOrErr: T | E, piped: U | V) => void = () => void 0
    ): U | V {
        const res = this.ok ? ok(this.valOrErr as T) : err(this.valOrErr as E);
        either(this.valOrErr, res);
        return res;
    }

    public get err(): E | null {
        return this.match(
            () => null,
            err => err
        );
    }

    public get val(): T {
        return this.match(
            val => val,
            () => undefined as unknown as T
        );
    }

    public get tuple(): [T | undefined, E | undefined] {
        return this.match(
            val => [val, undefined],
            err => [undefined, err]
        );
    }

    public unwrap<F = E>(mapErr?: (error: E) => F): T {
        return this.match(
            value => value,
            error => {
                if (mapErr) {
                    throw mapErr(error);
                }
                throw error;
            }
        );
    }

    public or(other: T): T {
        return this.match(
            val => val,
            () => other
        );
    }

    public expect(message?: string): T {
        return this.match(
            val => val,
            err => {
                throw message || JSON.stringify(err);
            }
        );
    }

    public map<U>(f: (value: T) => U): Result<U, E> {
        return this.match(
            val => Result.ok(f(val)),
            err => Result.err(err)
        );
    }

    public mapErr<F = ErrorDefault>(f: (error: E) => F): Result<T, F> {
        return this.match(
            val => Result.ok(val),
            err => Result.err(f(err))
        );
    }

    public static ok<T, E = ErrorDefault>(value: T = null as T): Result<T, E> {
        return new Result<T, E>(true, value);
    }

    public static err<T, E = ErrorDefault>(error: E): Result<T, E> {
        return new Result<T, E>(false, error);
    }

    public static collect<T, E = ErrorDefault>(iter: Iterable<Result<T, E>>): Result<T[], E> {
        const results: T[] = [];
        for (const result of iter) {
            if (result.err) {
                return Result.err(result.err);
            }
            results.push(result.unwrap());
        }
        return Result.ok(results);
    }

    public static filter<T, E = ErrorDefault>(iter: Iterable<Result<T, E>>): [T[], E[]] {
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

    public static async collectAsync<T, E = ErrorDefault>(
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

    public static async fromAsync<T>(op: () => Promise<T>): Promise<Result<T, unknown>> {
        try {
            return Result.ok(await op());
        } catch (e: unknown) {
            return Result.err(e);
        }
    }

    public static from<T>(op: () => T): Result<T, unknown> {
        try {
            return Result.ok(op());
        } catch (e: unknown) {
            return Result.err(e);
        }
    }

    public static wrap<T>(f: () => T): Result<T, unknown> {
        try {
            return Result.ok(f());
        } catch (e: unknown) {
            return Result.err(e);
        }
    }

    public static async wrapAsync<T>(op: () => Promise<T>): Promise<Result<T, unknown>> {
        try {
            return Result.ok(await op());
        } catch (e) {
            return Result.err(e);
        }
    }
}
