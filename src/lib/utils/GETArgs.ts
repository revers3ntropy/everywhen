export function GETArgs (args: Record<string, any>): string {
    return '?' + Object.keys(args)
                       .map((key) => `${key}=${args[key]}`)
                       .join('&');
}

export function GETParamIsTruthy (val: string | null = null): boolean {
    return val
        && val === 'true'
        || val === '1'
        || val === 'on'
        || val === 'yes'
        || val === 'y';
}