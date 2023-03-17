const RESULT_NULL = Symbol();

export class Result<T = null, E extends {} = string> {

    public static readonly NULL = RESULT_NULL;

    private constructor (
        private readonly value: T | typeof RESULT_NULL = RESULT_NULL,
        private readonly error: E | typeof RESULT_NULL = RESULT_NULL,
    ) {
    }

    public get err (): E | null {
        if (this.error === RESULT_NULL) {
            return null;
        }
        return this.error;
    }

    public get val (): T {
        if (this.value === RESULT_NULL) {
            return undefined as T;
        }
        return this.value;
    }

    public get isOk (): boolean {
        return this.value !== RESULT_NULL;
    }

    public static collect<T, E extends {}> (
        iter: Result<T, E>[],
    ): Result<T[], E> {
        const results: T[] = [];
        for (const result of iter) {
            if (result.err) {
                return Result.err(result.err);
            }
            results.push(result.val);
        }
        return Result.ok(results);
    }

    public static async awaitCollect<T, E extends {}> (
        iter: Promise<Result<T, E>>[],
    ): Promise<Result<T[], E>> {
        return Result.collect(await Promise.all(iter));
    }

    public static ok<T, E extends {}> (value: T): Result<T, E> {
        return new Result<T, E>(value, RESULT_NULL);
    }

    public static err<T, E extends {}> (error: E): Result<T, E> {
        return new Result<T, E>(RESULT_NULL, error);
    }

    public unwrap (): T {
        if (this.value === RESULT_NULL) {
            throw `Got error when unwrapping Result: '${String(this.error)}'`;
        }
        return this.value;
    }

    public map<U> (f: (value: T) => U): Result<U, E> {
        if (this.value === RESULT_NULL) {
            return this as unknown as Result<U, E>;
        }
        return Result.ok(f(this.value));
    }
}