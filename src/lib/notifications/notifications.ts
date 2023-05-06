import { writable } from 'svelte/store';
import type { Milliseconds } from '../../app';
import type { Result } from '../utils/result';

export enum NotificationType {
    ERROR = 'error',
    SUCCESS = 'success',
    INFO = 'info'
}

export interface Notification {
    text: string;
    type: NotificationType;
    timeout: Milliseconds;
}

export const notifications = writable<Notification[]>([]);

export interface Notify {
    (text: string, type?: NotificationType, timeout?: Milliseconds): void;
    info(text: string, timeout?: Milliseconds): void;
    success(text: string, timeout?: Milliseconds): void;
    error(text: string, timeout?: Milliseconds): void;
}

export function addNotification(notification: Notification) {
    notifications.update(n => [...n, notification]);

    setTimeout(() => {
        notifications.update(n => n.filter(n => n !== notification));
    });
}

export const notify: Notify = (
    text: string,
    type = NotificationType.INFO,
    timeout = 3000
): void => {
    addNotification({
        text,
        type,
        timeout
    });
};

notify.info = (text: string, timeout: Milliseconds = 4000) =>
    notify(text, NotificationType.INFO, timeout);
notify.success = (text: string, timeout: Milliseconds = 2000) =>
    notify(text, NotificationType.SUCCESS, timeout);
notify.error = (text: string, timeout: Milliseconds = 5000) =>
    notify(text, NotificationType.ERROR, timeout);

export function displayNotifOnErr<T extends NonNullable<unknown>>(
    { err, val }: Result<T>,
    onErr: (err: string | null) => unknown = () => 0
): T {
    if (err) {
        try {
            err = (JSON.parse(err) as Record<string, string>)?.message || err;
        } catch (e) {
            /* empty */
        }
        onErr(err);
        notify(err || 'Unknown error', NotificationType.ERROR, 4000);
        throw err;
    }
    return val;
}
