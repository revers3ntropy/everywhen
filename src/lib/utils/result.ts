type ValueConstraint = NonNullable<unknown> | null;
type ErrorConstraint = NonNullable<unknown>;
type ValueDefault = null;
type ErrorDefault = string;

export class Result<
    T extends ValueConstraint = ValueDefault,
    E extends ErrorConstraint = ErrorDefault
> {
    protected constructor(
        public readonly ok: boolean,
        private readonly valOrErr: T | E
    ) {}

    public match<U, V>(ok: (value: T) => U, err: (error: E) => V): U | V {
        return this.ok ? ok(this.valOrErr as T) : err(this.valOrErr as E);
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

    public unwrap(): T {
        return this.match(
            value => value,
            error => {
                throw `Got error when unwrapping Result: ${JSON.stringify(error)}`;
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

    public map<U extends ValueConstraint = ValueDefault>(f: (value: T) => U): Result<U, E> {
        return this.match(
            val => Result.ok(f(val)),
            err => Result.err(err)
        );
    }

    public static ok<
        T extends ValueConstraint = ValueDefault,
        E extends ErrorConstraint = ErrorDefault
    >(value: T = null as T): Result<T, E> {
        return new Result<T, E>(true, value);
    }

    public static err<
        T extends ValueConstraint = ValueDefault,
        E extends ErrorConstraint = ErrorDefault
    >(error: E): Result<T, E> {
        return new Result<T, E>(false, error);
    }

    public static collect<
        T extends ValueConstraint = ValueDefault,
        E extends ErrorConstraint = ErrorDefault
    >(iter: Iterable<Result<T, E>>): Result<T[], E> {
        const results: T[] = [];
        for (const result of iter) {
            if (result.err) {
                return Result.err(result.err);
            }
            results.push(result.unwrap());
        }
        return Result.ok(results);
    }

    public static wrap<T extends ValueConstraint = ValueDefault>(
        f: () => T
    ): Result<T, ErrorConstraint> {
        try {
            return Result.ok(f());
        } catch (e: unknown) {
            return Result.err(e as ErrorConstraint);
        }
    }

    public static wrapAsync<T extends ValueConstraint = ValueDefault>(
        op: () => Promise<T>
    ): Promise<Result<T, ErrorConstraint>> {
        try {
            return op()
                .then(val => Result.ok(val))
                .catch(e => Result.err(e));
        } catch (e) {
            return Promise.resolve(Result.err(e as ErrorConstraint));
        }
    }
}
