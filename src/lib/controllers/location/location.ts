import type { Degrees, Meters, TimestampSecs } from '../../../types';
import { roundToDecimalPlaces } from '$lib/utils/text';

export interface Location {
    id: string;
    created: TimestampSecs;
    name: string;
    latitude: Degrees;
    longitude: Degrees;
    radius: Degrees;
}

export interface AddressLookupResults {
    number: string | null;
    street: string | null;
    postcode: string | null;
    place: string | null;
    region: string | null;
    country: string | null;
}

export namespace Location {
    /**
     * @param lat
     * @param lon
     * @param decimalPlaces the lower the less precise the location will be
     */
    export function decreaseResolutionOfCoords(
        lat: number,
        lon: number,
        decimalPlaces = 3
    ): [number, number] {
        return [roundToDecimalPlaces(lat, decimalPlaces), roundToDecimalPlaces(lon, decimalPlaces)];
    }

    export function metersToDegrees(m: Meters): Degrees {
        return m / 111_111;
    }

    export function degreesToMeters(d: Degrees): Meters {
        return d * 111_111;
    }

    export function degreesToMetersPrecise(
        d: Degrees,
        resolution: number,
        mPerUnit: number,
        latitude: Degrees
    ): Meters {
        // https://stackoverflow.com/questions/32202944
        return (
            degreesToMeters(d) / ((resolution / mPerUnit) * Math.cos(latitude * (Math.PI / 180)))
        );
    }

    export function metersToDegreesPrecise(
        m: Meters,
        resolution: number,
        mPerUnit: number,
        latitude: Degrees
    ): Degrees {
        return (
            metersToDegrees(m) * ((resolution / mPerUnit) * Math.cos(latitude * (Math.PI / 180)))
        );
    }

    export function distBetweenPointsPrecise(
        lat1: Degrees,
        lon1: Degrees,
        lat2: Degrees,
        lon2: Degrees
    ): Meters {
        // https://stackoverflow.com/questions/639695/
        const R = 6378.137; // Radius of earth in KM
        const dLat = (lat2 * Math.PI) / 180 - (lat1 * Math.PI) / 180;
        const dLon = (lon2 * Math.PI) / 180 - (lon1 * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d * 1000; // meters
    }

    export function filterByCirclePrecise<
        T extends { latitude: Degrees | null; longitude: Degrees | null }
    >(values: T[], lat: number, lng: number, radius: Meters, acceptNoLocation = false): T[] {
        return values.filter(({ latitude, longitude }) => {
            if (latitude === null || longitude === null) {
                return acceptNoLocation;
            }
            return distBetweenPointsPrecise(lat, lng, latitude, longitude) <= radius;
        });
    }

    export function filterByDynCirclePrecise<
        T extends { latitude: Degrees; longitude: Degrees; radius: Meters }
    >(values: T[], lat: number, lng: number, mapRadius = (r: number) => r): T[] {
        return values.filter(
            ({ latitude, longitude, radius }) =>
                distBetweenPointsPrecise(lat, lng, latitude, longitude) <= mapRadius(radius)
        );
    }

    /**
     * 'touching' is returned sorted by radius ascending
     */
    export function filterLocationsByPoint<T extends { latitude: Degrees; longitude: Degrees }>(
        locations: Location[],
        point: T
    ): { touching: Location[]; near: Location[] } {
        const touching: Location[] = [];
        const near: Location[] = [];

        for (const location of locations) {
            const radius = degreesToMeters(location.radius);
            const dist = distBetweenPointsPrecise(
                location.latitude,
                location.longitude,
                point.latitude,
                point.longitude
            );
            if (dist <= radius) {
                touching.push(location);
            } else if (dist <= radius * 2) {
                near.push(location);
            }
        }

        touching.sort((a, b) => a.radius - b.radius);

        return {
            touching,
            near
        };
    }
}
