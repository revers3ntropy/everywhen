export function serializeGETArgs (args: Record<string, any>): string {
    return '?' + Object.keys(args)
                       .map((key) => `${key}=${args[key]}`)
                       .join('&');
}

export function getGETArgs (): Record<string, string> {
    const args: Record<string, any> = {};
    const searchParams = new URLSearchParams(location.search);
    searchParams.forEach((value, key) => {
        args[key] = value;
    });
    return args;
}

export function GETParamIsTruthy (val: string | null = null): boolean {
    return val
        && val === 'true'
        || val === '1'
        || val === 'on'
        || val === 'yes'
        || val === 'y'
        || val === 't'
        || val === 'ok';
}

export function GETParamIsFalsy (val: string | null = null): boolean {
    return val
        && val === 'false'
        || val === '0'
        || val === 'off'
        || val === 'no'
        || val === 'n'
        || val === 'f'
        || val === 'cancel';
}