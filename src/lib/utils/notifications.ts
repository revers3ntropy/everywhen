import type { Result } from './result';
import type { NotificationOptions, PickOptional } from './types';

export const INFO_NOTIFICATION = Object.freeze({
    removeAfter: 4000,
    type: 'info',
    position: 'top-center',
} as const satisfies NotificationOptions);
export const ERR_NOTIFICATION = Object.freeze({
    removeAfter: 8000,
    text: 'An error has occurred',
    type: 'error',
    position: 'top-center',
} as const satisfies NotificationOptions);
export const SUCCESS_NOTIFICATION = Object.freeze({
    removeAfter: 4000,
    text: 'Success',
    type: 'success',
    position: 'top-center',
} as const satisfies NotificationOptions);

export function displayNotifOnErr<T> (
    addNotification: (notification: NotificationOptions) => void,
    { err, val }: Result<T>,
    options: PickOptional<NotificationOptions> = {},
): T {
    if (err) {
        try {
            err = (JSON.parse(err) as any)?.message
                || err;
        } catch (e) {
        }
        addNotification({
            ...ERR_NOTIFICATION,
            text: err || 'Unknown error',
            ...options,
        });
        throw err;
    }
    return val;
}