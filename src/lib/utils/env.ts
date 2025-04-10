import { PUBLIC_ENV } from '$env/static/public';

export function isProd() {
    return PUBLIC_ENV === 'prod';
}

export function isStaging() {
    return PUBLIC_ENV === 'staging';
}

export function isDev() {
    return PUBLIC_ENV === 'dev';
}

export function isTest() {
    return PUBLIC_ENV === 'test';
}
