import type { ResultSetHeader } from 'mysql2';
import type { QueryFunc } from '$lib/db/mysql.server';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { Location as _Location } from './location';
import type { Auth } from '$lib/controllers/auth/auth.server';
import { UUIdControllerServer } from '$lib/controllers/uuid/uuid.server';

export type Location = _Location;

namespace LocationUtils {
    export async function create(
        query: QueryFunc,
        auth: Auth,
        created: number,
        createdTZOffset: number,
        name: string,
        latitude: number,
        longitude: number,
        radius: number
    ): Promise<Result<Location>> {
        if (radius < 0) {
            return Result.err('Radius cannot be negative');
        }
        if (!name) {
            return Result.err('Name cannot be empty');
        }

        const id = await UUIdControllerServer.generate();

        const encryptedName = encrypt(name, auth.key);
        if (encryptedName.length > 256) {
            return Result.err('Name too long');
        }

        await query`
            INSERT INTO locations (id, user, created, createdTZOffset, name,
                                   latitude, longitude, radius)
            VALUES (${id}, ${auth.id}, ${created}, ${createdTZOffset}, ${encryptedName},
                    ${latitude}, ${longitude}, ${radius})
        `;

        return Result.ok({ id, created, createdTZOffset, name, latitude, longitude, radius });
    }

    export async function all(query: QueryFunc, auth: Auth): Promise<Result<Location[]>> {
        return fromRaw(
            auth,
            await query<Location[]>`
            SELECT id, created, createdTZOffset, name, latitude, longitude, radius
            FROM locations
            WHERE user = ${auth.id}
            ORDER BY created DESC
        `
        );
    }

    function fromRaw(auth: Auth, rows: Location[]): Result<Location[]> {
        return Result.collect(
            rows.map(row => {
                const { err, val: name } = decrypt(row.name, auth.key);
                if (err) return Result.err(err);
                return Result.ok({
                    id: row.id,
                    created: row.created,
                    createdTZOffset: row.createdTZOffset,
                    name,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    radius: row.radius
                });
            })
        );
    }

    export async function search(
        query: QueryFunc,
        auth: Auth,
        lat: number,
        lng: number
    ): Promise<Result<{ locations: Location[]; nearby?: Location[] }>> {
        const { err, val: locations } = fromRaw(
            auth,
            _Location.filterByDynCirclePrecise(
                await query<Location[]>`
                    SELECT id, created, createdTZOffset, name, latitude, longitude, radius
                    FROM locations
                    WHERE user = ${auth.id}
                      AND SQRT(POW(latitude - ${lat}, 2) + POW(longitude - ${lng}, 2)) <= radius * 2
                    ORDER BY radius, created DESC
                `,
                lat,
                lng,
                r => _Location.degreesToMeters(r)
            )
        );

        if (err) return Result.err(err);
        if (locations.length > 0) return Result.ok({ locations });

        const { err: nearbyErr, val: nearby } = fromRaw(
            auth,
            _Location.filterByDynCirclePrecise(
                await query<Location[]>`
                SELECT id, created, createdTZOffset, name, latitude, longitude, radius
                FROM locations
                WHERE user = ${auth.id}
                  AND SQRT(POW(latitude - ${lat}, 2) + POW(longitude - ${lng}, 2)) <=
                      radius * 4
                ORDER BY radius, created DESC
            `,
                lat,
                lng,
                r => _Location.degreesToMeters(r) * 2
            )
        );
        if (nearbyErr) return Result.err(nearbyErr);

        return Result.ok({ locations, nearby });
    }

    export async function fromId(
        query: QueryFunc,
        auth: Auth,
        id: string
    ): Promise<Result<Location>> {
        const { val, err } = fromRaw(
            auth,
            await query<Location[]>`
                SELECT id, created, createdTZOffset, name, latitude, longitude, radius
                FROM locations
                WHERE user = ${auth.id}
                  AND id = ${id}
            `
        );
        if (err) return Result.err(err);
        if (val.length === 0) return Result.err('Location not found');
        return Result.ok(val[0]);
    }

    export async function updateName(
        query: QueryFunc,
        auth: Auth,
        location: Location,
        newName: string
    ): Promise<Result<Location>> {
        if (!newName) return Result.err('Name must not be empty');

        const encryptedName = encrypt(newName, auth.key);

        if (encryptedName.length > 256) {
            return Result.err('Name too long');
        }

        await query`
            UPDATE locations
            SET name = ${encryptedName}
            WHERE user = ${auth.id}
              AND id = ${location.id}
        `;
        return Result.ok({
            ...location,
            name: newName
        });
    }

    export async function updateRadius(
        query: QueryFunc,
        auth: Auth,
        location: Location,
        newRadius: number
    ): Promise<Result<Location>> {
        if (newRadius < 0) return Result.err('Radius must be greater than 0');

        await query`
            UPDATE locations
            SET radius = ${newRadius}
            WHERE user = ${auth.id}
              AND id = ${location.id}
        `;
        return Result.ok({
            ...location,
            radius: newRadius
        });
    }

    export async function updateLocation(
        query: QueryFunc,
        auth: Auth,
        location: Location,
        newLatitude: number,
        newLongitude: number
    ): Promise<Result<Location>> {
        if (newLatitude < -90 || newLatitude > 90) {
            return Result.err('Latitude must be between -90 and 90');
        }
        if (newLongitude < -180 || newLongitude > 180) {
            return Result.err('Longitude must be between -180 and 180');
        }

        await query`
            UPDATE locations
            SET latitude  = ${newLatitude},
                longitude = ${newLongitude}
            WHERE user = ${auth.id}
              AND id = ${location.id}
        `;
        return Result.ok({
            ...location,
            latitude: newLatitude,
            longitude: newLongitude
        });
    }

    export async function purge(query: QueryFunc, auth: Auth, id: string): Promise<Result<null>> {
        const res = await query<ResultSetHeader>`
            DELETE
            FROM locations
            WHERE user = ${auth.id}
              AND id = ${id}
        `;
        if (!res.affectedRows) {
            return Result.err('Location not found');
        }
        return Result.ok(null);
    }

    export async function purgeAll(query: QueryFunc, auth: Auth): Promise<Result<null>> {
        await query`
            DELETE
            FROM locations
            WHERE user = ${auth.id}
        `;
        return Result.ok(null);
    }
}

export const Location = LocationUtils;
