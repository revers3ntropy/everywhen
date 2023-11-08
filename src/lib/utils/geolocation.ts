import { notify } from '$lib/components/notifications/notifications';

type OptionalCoords = [number, number] | [null, null];

export async function getLocation(): Promise<OptionalCoords> {
    return await new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
            pos => {
                resolve([pos.coords.latitude, pos.coords.longitude]);
            },
            err => {
                notify.error(`Cannot get location: ${err.message}`);
                resolve(nullLocation());
            }
        );
    });
}

export function nullLocation(): OptionalCoords {
    return [null, null];
}
