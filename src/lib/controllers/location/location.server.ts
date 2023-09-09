import { LIMITS } from '$lib/constants';
import { query } from '$lib/db/mysql.server';
import type { ResultSetHeader } from 'mysql2';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { Location as _Location } from './location';
import type { Auth } from '$lib/controllers/auth/auth.server';
import { UId } from '$lib/controllers/uuid/uuid.server';

namespace LocationServer {
    type Location = _Location;

    async function canCreateWithName(auth: Auth, name: string): Promise<true | string> {
        if (!name) return 'Location name too short';
        if (name.length > LIMITS.location.nameLenMax)
            return `Location name too long (> ${LIMITS.location.nameLenMax} characters)`;

        const encryptedName = encrypt(name, auth.key);
        if (encryptedName.length > 256) return 'Location name too long';

        const numLocations = await query<{ count: number }[]>`
            SELECT COUNT(*) as count
            FROM locations
            WHERE userId = ${auth.id}
        `;

        if (numLocations[0].count >= LIMITS.location.maxCount) {
            return 'Maximum number of locations reached';
        }

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

        if (newName.length > LIMITS.location.nameLenMax) return Result.err('Name too long');
        if (newName.length < LIMITS.location.nameLenMin) return Result.err('Name too short');

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
}

export const Location = {
    ..._Location,
    ...LocationServer
};

export type Location = _Location;
