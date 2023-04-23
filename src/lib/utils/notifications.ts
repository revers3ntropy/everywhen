import type { Result } from './result';
import type { NotificationOptions, PickOptional } from './types';

export const WARN_NOTIFICATION = Object.freeze({
    removeAfter: 6000,
    type: 'warning',
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
export const INFO_NOTIFICATION = Object.freeze({
    removeAfter: 4000,
    type: 'info',
    position: 'top-center',
} as const satisfies NotificationOptions);

export type Notifier = (notification: NotificationOptions) => void;

export function displayNotifOnErr<T extends NonNullable<unknown>> (
    addNotification: Notifier,
    { err, val }: Result<T>,
    options: PickOptional<NotificationOptions> = {},
    onErr: (err: string | null) => unknown = () => 0,
): T {
    if (err) {
        try {
            err = (JSON.parse(err) as Record<string, string>)?.message || err;
        } catch (e) { /* empty */ }
        onErr(err);
        addNotification({
            ...ERR_NOTIFICATION,
            text: err || 'Unknown error',
            ...options,
        });
        throw err;
    }
    return val;
}