import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { UsageLimits } from '$lib/controllers/usageLimits/usageLimits.server';
import { query } from '$lib/db/mysql.server';
import type { ResultSetHeader } from 'mysql2';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import type { Degrees } from '../../../types';
import { type AddressLookupResults, Location as _Location } from './location';
import type { Auth } from '$lib/controllers/auth/auth.server';
import { UId } from '$lib/controllers/uuid/uuid.server';
import { z } from 'zod';
import { MAPBOX_ACCESS_TOK } from '$env/static/private';
import { FileLogger } from '$lib/utils/log.server';

const locationLogger = new FileLogger('LOC');

namespace LocationServer {
    type Location = _Location;

    async function canCreateWithName(auth: Auth, name: string): Promise<true | string> {
        if (!name) return 'Location name too short';
        if (name.length > UsageLimits.LIMITS.location.nameLenMax)
            return `Location name too long (> ${UsageLimits.LIMITS.location.nameLenMax} characters)`;

        const encryptedName = encrypt(name, auth.key);
        if (encryptedName.length > 256) return 'Location name too long';

        const [count, max] = await UsageLimits.locationUsage(
            auth,
            await Subscription.getCurrentSubscription(auth)
        );
        if (count >= max) return 'Maximum number of locations reached';

        return true;
    }

    export async function create(
        auth: Auth,
        created: number,
        name: string,
        latitude: number,
        longitude: number,
        radius: number
    ): Promise<Result<Location>> {
        if (radius < 0) {
            return Result.err('Radius cannot be negative');
        }

        const canCreate = await canCreateWithName(auth, name);
        if (canCreate !== true) return Result.err(canCreate);

        const id = await UId.generate();

        const encryptedName = encrypt(name, auth.key);
        if (encryptedName.length > 256) {
            return Result.err('Name too long');
        }

        await query`
            INSERT INTO locations (id, userId, created, name,
                                   latitude, longitude, radius)
            VALUES (${id}, ${auth.id}, ${created}, ${encryptedName},
                    ${latitude}, ${longitude}, ${radius})
        `;

        return Result.ok({ id, created, name, latitude, longitude, radius });
    }

    export async function all(auth: Auth): Promise<Result<Location[]>> {
        return fromRaw(
            auth,
            await query<
                {
                    id: string;
                    created: number;
                    name: string;
                    latitude: number;
                    longitude: number;
                    radius: number;
                }[]
            >`
                SELECT id, created, name, latitude, longitude, radius
                FROM locations
                WHERE userId = ${auth.id}
                ORDER BY created DESC
            `
        );
    }

    function fromRaw(auth: Auth, rows: Location[]): Result<Location[]> {
        return Result.collect(
            rows.map(row => {
                const name = decrypt(row.name, auth.key);
                if (!name.ok) return name.cast();
                return Result.ok({
                    id: row.id,
                    created: row.created,
                    name: name.val,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    radius: row.radius
                });
            })
        );
    }

    export async function search(
        auth: Auth,
        lat: number,
        lng: number
    ): Promise<Result<{ locations: Location[]; nearby?: Location[] }>> {
        const locations = fromRaw(
            auth,
            _Location.filterByDynCirclePrecise(
                await query<
                    {
                        id: string;
                        created: number;
                        name: string;
                        latitude: number;
                        longitude: number;
                        radius: number;
                    }[]
                >`
                    SELECT id, created, name, latitude, longitude, radius
                    FROM locations
                    WHERE userId = ${auth.id}
                      AND SQRT(POW(latitude - ${lat}, 2) + POW(longitude - ${lng}, 2)) <= radius * 2
                    ORDER BY radius, created DESC
                `,
                lat,
                lng,
                r => _Location.degreesToMeters(r)
            )
        );

        if (!locations.ok) return locations.cast();
        if (locations.val.length > 0) {
            return Result.ok({ locations: locations.val });
        }

        const nearby = fromRaw(
            auth,
            _Location.filterByDynCirclePrecise(
                await query<
                    {
                        id: string;
                        created: number;
                        name: string;
                        latitude: number;
                        longitude: number;
                        radius: number;
                    }[]
                >`
                SELECT id, created, name, latitude, longitude, radius
                FROM locations
                WHERE userId = ${auth.id}
                  AND SQRT(POW(latitude - ${lat}, 2) + POW(longitude - ${lng}, 2)) <=
                      radius * 4
                ORDER BY radius, created DESC
            `,
                lat,
                lng,
                r => _Location.degreesToMeters(r) * 2
            )
        );
        if (!nearby.ok) return nearby.cast();

        return Result.ok({
            locations: locations.val,
            nearby: nearby.val
        });
    }

    export async function fromId(auth: Auth, id: string): Promise<Result<Location>> {
        const location = fromRaw(
            auth,
            await query<
                {
                    id: string;
                    created: number;
                    name: string;
                    latitude: number;
                    longitude: number;
                    radius: number;
                }[]
            >`
                SELECT id, created, name, latitude, longitude, radius
                FROM locations
                WHERE userId = ${auth.id}
                  AND id = ${id}
            `
        );
        if (!location.ok) return location.cast();
        if (location.val.length !== 1) return Result.err('Location not found');
        return Result.ok(location.val[0]);
    }

    export async function updateName(
        auth: Auth,
        location: Location,
        newName: string
    ): Promise<Result<Location>> {
        if (!newName) return Result.err('Name must not be empty');

        const encryptedName = encrypt(newName, auth.key);

        if (newName.length > UsageLimits.LIMITS.location.nameLenMax)
            return Result.err('Name too long');
        if (newName.length < UsageLimits.LIMITS.location.nameLenMin)
            return Result.err('Name too short');

        await query`
            UPDATE locations
            SET name = ${encryptedName}
            WHERE userId = ${auth.id}
              AND id = ${location.id}
        `;
        return Result.ok({
            ...location,
            name: newName
        });
    }

    export async function updateRadius(
        auth: Auth,
        location: Location,
        newRadius: number
    ): Promise<Result<Location>> {
        if (newRadius < 0) return Result.err('Radius must be greater than 0');

        await query`
            UPDATE locations
            SET radius = ${newRadius}
            WHERE userId = ${auth.id}
              AND id = ${location.id}
        `;
        return Result.ok({
            ...location,
            radius: newRadius
        });
    }

    export async function updateLocation(
        auth: Auth,
        location: Location,
        newLatitude: number,
        newLongitude: number
    ): Promise<Result<Location>> {
        if (newLatitude < -90 || newLatitude > 90)
            return Result.err('Latitude must be between -90 and 90');

        if (newLongitude < -180 || newLongitude > 180)
            return Result.err('Longitude must be between -180 and 180');

        await query`
            UPDATE locations
            SET latitude  = ${newLatitude},
                longitude = ${newLongitude}
            WHERE userId = ${auth.id}
              AND id = ${location.id}
        `;
        return Result.ok({
            ...location,
            latitude: newLatitude,
            longitude: newLongitude
        });
    }

    export async function purge(auth: Auth, id: string): Promise<Result<null>> {
        const res = await query<ResultSetHeader>`
            DELETE
            FROM locations
            WHERE userId = ${auth.id}
              AND id = ${id}
        `;
        if (!res.affectedRows) {
            return Result.err('Location not found');
        }
        return Result.ok(null);
    }

    export async function purgeAll(auth: Auth): Promise<Result<null>> {
        await query`
            DELETE
            FROM locations
            WHERE userId = ${auth.id}
        `;
        return Result.ok(null);
    }

    export async function updateEncryptedFields(
        userId: string,
        oldDecrypt: (a: string) => Result<string>,
        newEncrypt: (a: string) => string
    ): Promise<Result<null[], string>> {
        const locations = await query<
            {
                id: string;
                name: string;
            }[]
        >`
            SELECT id, name
            FROM locations
            WHERE userId = ${userId}
        `;

        return await Result.collectAsync(
            locations.map(async (location): Promise<Result<null>> => {
                const nameRes = oldDecrypt(location.name);
                if (!nameRes.ok) return nameRes.cast();

                await query`
                    UPDATE locations
                    SET name = ${newEncrypt(nameRes.val)}
                    WHERE id = ${location.id}
                      AND userId = ${userId}
                `;
                return Result.ok(null);
            })
        );
    }

    export async function filterByLocationPrecise<
        T extends { latitude: Degrees | null; longitude: Degrees | null }
    >(auth: Auth, values: T[], locationId: string): Promise<Result<T[]>> {
        const location = await fromId(auth, locationId);
        if (!location.ok) return location.cast();
        const { latitude, longitude, radius } = location.val;
        return Result.ok(
            _Location.filterByCirclePrecise(
                values,
                latitude,
                longitude,
                _Location.degreesToMeters(radius)
            )
        );
    }

    const API_RES_TYPE = z.object({
        val: z.object({
            features: z.array(
                z.object({
                    properties: z.object({
                        feature_type: z.string(),
                        context: z.object({
                            address: z
                                .object({
                                    address_number: z.string()
                                })
                                .optional(),
                            street: z
                                .object({
                                    name: z.string()
                                })
                                .optional(),
                            postcode: z
                                .object({
                                    name: z.string()
                                })
                                .optional(),
                            place: z
                                .object({
                                    name: z.string()
                                })
                                .optional(),
                            region: z
                                .object({
                                    name: z.string()
                                })
                                .optional(),
                            country: z
                                .object({
                                    name: z.string(),
                                    country_code: z.string()
                                })
                                .optional()
                        })
                    })
                })
            )
        })
    });

    const addrLookupCache = new Map<string, AddressLookupResults>();

    export async function addressLookupFromCoords(
        lat: Degrees,
        lon: Degrees
    ): Promise<Result<AddressLookupResults>> {
        const cacheKey = `${lat}#${lon}`;
        if (addrLookupCache.has(cacheKey)) return Result.ok(addrLookupCache.get(cacheKey)!);

        if (!MAPBOX_ACCESS_TOK) return Result.err('no Mapbox access token found');

        // https://docs.mapbox.com/api/search/geocoding/#example-request-reverse-geocoding
        const res = await fetch(
            `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lon}&latitude=${lat}&access_token=${MAPBOX_ACCESS_TOK}`
        );
        if (!res.ok) {
            void locationLogger.log('failed to get response from Mapbox', {
                res,
                resText: await res.text(),
                lat,
                lon,
                MAPBOX_ACCESS_TOK
            });
            return Result.err('failed to get response from Mapbox');
        }
        const resTxt = await res.text();
        const resJson = Result.tryJsonParse(resTxt);
        if (!resJson.ok) {
            void locationLogger.log('failed to get response from Mapbox', { lat, lon, resTxt });
            return Result.err('invalid data from Mapbox');
        }
        const validateRes = API_RES_TYPE.safeParse(resJson);
        if (validateRes.error) {
            void locationLogger.log('invalid mapbox res', { validateRes, resJson, lat, lon });
            return Result.err('invalid address from Mapbox');
        }
        const features = validateRes.data.val['features'];

        let number = null;
        let street = null;
        let postcode = null;
        let place = null;
        let region = null;
        let country = null;

        for (const feature of features) {
            const details = feature['properties']['context'];
            if (details['address'] && !number) {
                number = details['address']['address_number'];
            }
            if (details['street'] && !street) {
                street = details['street']['name'];
            }
            if (details['postcode'] && !postcode) {
                postcode = details['postcode']['name'];
            }
            if (details['place'] && !place) {
                place = details['place']['name'];
            }
            if (details['region'] && !region) {
                region = details['region']['name'];
            }
            if (details['country'] && !country) {
                country = details['country']['name'];
            }
        }

        const address = {
            number,
            street,
            postcode,
            place,
            region,
            country
        } satisfies AddressLookupResults;
        addrLookupCache.set(cacheKey, address);
        return Result.ok(address);
    }
}

export const Location = {
    ..._Location,
    ...LocationServer
};

export type Location = _Location;
