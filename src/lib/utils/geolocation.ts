import type { Notifier } from './notifications';
import { ERR_NOTIFICATION } from './notifications';

type OptionalCoords = [number, number] | [null, null];

export async function getLocation(
    addNotification: Notifier
): Promise<OptionalCoords> {
    return await new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
            pos => {
                resolve([pos.coords.latitude, pos.coords.longitude]);
            },
            err => {
                addNotification({
                    ...ERR_NOTIFICATION,
                    text: `Cannot get location: ${err.message}`
                });
                resolve([null, null]);
            }
        );
    });
}
