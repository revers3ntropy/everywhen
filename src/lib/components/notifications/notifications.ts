import { browser } from '$app/environment';
import { clientLogger } from '$lib/utils/log';
import { writable } from 'svelte/store';
import type { Result } from '$lib/utils/result';

export enum NotificationType {
    ERROR = 'error',
    SUCCESS = 'success',
    INFO = 'info'
}

export interface Notification {
    text: string;
    type: NotificationType;
    timeout: Milliseconds;
    created: TimestampMilliseconds;
}

export const notifications = writable<Notification[]>([]);

export interface Notify {
    (text: string | string[], type?: NotificationType, timeout?: Milliseconds): void;
    info(text: string | string[], timeout?: Milliseconds): void;
    success(text: string | string[], timeout?: Milliseconds): void;
    error(text: string | string[], timeout?: Milliseconds): void;
    onErr<T>(result: Result<T>, onErr?: (err: string | null) => unknown): T;
}

export function removeNotification(notification: Notification) {
    notifications.update(notifs => notifs.filter(n => n !== notification));
}

export function addNotification(notification: Notification) {
    notifications.update(n => [...n, notification]);
    setTimeout(() => removeNotification(notification), notification.timeout);
}

export const notify: Notify = (
    texts: string | string[],
    type = NotificationType.INFO,
    timeout = 3000
): void => {
    if (!browser) return;
    if (typeof texts === 'string') {
        texts = [texts];
    }
    for (const message of texts) {
        addNotification({
            text: message,
            type,
            timeout,
            created: Date.now()
        });
    }
};

notify.info = (text: string | string[], timeout: Milliseconds = 4000) =>
    notify(text, NotificationType.INFO, timeout);
notify.success = (text: string | string[], timeout: Milliseconds = 2000) =>
    notify(text, NotificationType.SUCCESS, timeout);
notify.error = (text: string | string[], timeout: Milliseconds = 5000) => {
    if (typeof text === 'string' || text.length > 0) {
        clientLogger.error(text);
    }
    notify(text, NotificationType.ERROR, timeout);
};
notify.onErr = <T, E>(
    result: Result<T, E>,
    onErr: (err: string | null) => unknown = () => 0
): T => {
    return result.match(
        val => val,
        err => {
            let errFmt = JSON.stringify(err);
            if (typeof err === 'string') {
                try {
                    errFmt =
                        (JSON.parse(err as string) as Record<string, string>)?.['message'] || err;
                } catch (e) {
                    errFmt = err;
                }
            }

            onErr(errFmt);
            notify(errFmt || 'Unknown error', NotificationType.ERROR, 4000);
            throw err;
        }
    );
};
