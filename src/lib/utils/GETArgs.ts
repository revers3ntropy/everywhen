export function serializeGETArgs(
    args: Record<string, string | number | boolean | undefined>
): string {
    const keys = Object.keys(args).filter(key => args[key] !== undefined);
    if (!keys.length) return '';
    return (
        '?' +
        keys
            .map(
                key =>
                    `${key}=${(
                        args[key] as string | number | boolean
                    ).toString()}`
            )
            .join('&')
    );
}

export function GETParamIsTruthy(val: string | null = null): boolean {
    return (
        (val && val === 'true') ||
        val === '1' ||
        val === 'on' ||
        val === 'yes' ||
        val === 'y' ||
        val === 't' ||
        val === 'ok'
    );
}

export function GETParamIsFalsy(val: string | null = null): boolean {
    return (
        (val && val === 'false') ||
        val === '0' ||
        val === 'off' ||
        val === 'no' ||
        val === 'n' ||
        val === 'f' ||
        val === 'cancel'
    );
}
