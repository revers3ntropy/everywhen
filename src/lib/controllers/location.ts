import type { ResultSetHeader } from 'mysql2';
import type { QueryFunc } from '../db/mysql';
import { decrypt, encrypt } from '../security/encryption';
import { Result } from '../utils/result';
import type { Auth } from './user';
import { UUID } from './uuid';

export class Location {
    public constructor(
        public id: string,
        public created: number,
        public createdTZOffset: number,
        public name: string,
        public latitude: number,
        public longitude: number,
        public radius: number
    ) {}

    public static async create(
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

        const id = await UUID.generateUUId(query);

        const { err: nameErr, val: encryptedName } = encrypt(name, auth.key);
        if (nameErr) return Result.err(nameErr);

        if (encryptedName.length > 256) {
            return Result.err('Name too long');
        }

        await query`
            INSERT INTO locations (id, user, created, createdTZOffset, name,
                                   latitude, longitude, radius)
            VALUES (${id}, ${auth.id}, ${created}, ${createdTZOffset}, ${encryptedName},
                    ${latitude}, ${longitude}, ${radius})
        `;

        return Result.ok(
            new Location(
                id,
                created,
                createdTZOffset,
                name,
                latitude,
                longitude,
                radius
            )
        );
    }

    public static jsonIsRawLocation(
        json: unknown
    ): json is Omit<Location, 'id'> {
        return (
            typeof json === 'object' &&
            json !== null &&
            'created' in json &&
            typeof json.created === 'number' &&
            (!('createdTZOffset' in json) ||
                typeof json.createdTZOffset === 'number') &&
            'name' in json &&
            typeof json.name === 'string' &&
            'latitude' in json &&
            typeof json.latitude === 'number' &&
            'longitude' in json &&
            typeof json.longitude === 'number' &&
            'radius' in json &&
            typeof json.radius === 'number'
        );
    }

    public static async all(
        query: QueryFunc,
        auth: Auth
    ): Promise<Result<Location[]>> {
        return Location.fromRaw(
            auth,
            await query<Location[]>`
            SELECT id, created, createdTZOffset, name, latitude, longitude, radius
            FROM locations
            WHERE user = ${auth.id}
            ORDER BY created DESC
        `
        );
    }

    public static async search(
        query: QueryFunc,
        auth: Auth,
        lat: number,
        lng: number
    ): Promise<Result<{ locations: Location[]; nearby?: Location[] }>> {
        const { err, val: locations } = Location.fromRaw(
            auth,
            await query<Location[]>`
            SELECT id, created, createdTZOffset, name, latitude, longitude, radius
            FROM locations
            WHERE user = ${auth.id}
              AND SQRT(POW(latitude - ${lat}, 2) + POW(longitude - ${lng}, 2)) <= radius
            ORDER BY radius, created DESC
        `
        );

        if (err) return Result.err(err);
        if (locations.length > 0) return Result.ok({ locations });

        const { err: nearbyErr, val: nearby } = Location.fromRaw(
            auth,
            await query<Location[]>`
            SELECT id, created, createdTZOffset, name, latitude, longitude, radius
            FROM locations
            WHERE user = ${auth.id}
              AND SQRT(POW(latitude - ${lat}, 2) + POW(longitude - ${lng}, 2)) <=
                  radius * 2
            ORDER BY radius, created DESC
        `
        );
        if (nearbyErr) return Result.err(nearbyErr);

        return Result.ok({ locations, nearby });
    }

    public static async fromId(
        query: QueryFunc,
        auth: Auth,
        id: string
    ): Promise<Result<Location>> {
        return Location.fromRaw(
            auth,
            await query<Location[]>`
            SELECT id, created, createdTZOffset, name, latitude, longitude, radius
            FROM locations
            WHERE user = ${auth.id}
              AND id = ${id}
        `
        ).map(labels => labels[0]);
    }

    public static async updateName(
        query: QueryFunc,
        auth: Auth,
        location: Location,
        newName: string
    ): Promise<Result<Location>> {
        if (!newName) return Result.err('Name must not be empty');

        const { err, val: encryptedName } = encrypt(newName, auth.key);
        if (err) return Result.err(err);

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

    public static async updateRadius(
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

    public static async updateLocation(
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

    public static metersToDegrees(m: number): number {
        return m / 111_111;
    }

    public static degreesToMeters(d: number): number {
        return d * 111_111;
    }

    public static async purge(
        query: QueryFunc,
        auth: Auth,
        id: string
    ): Promise<Result> {
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

    public static async purgeAll(
        query: QueryFunc,
        auth: Auth
    ): Promise<Result> {
        await query`
            DELETE
            FROM locations
            WHERE user = ${auth.id}
        `;
        return Result.ok(null);
    }

    private static fromRaw(auth: Auth, rows: Location[]): Result<Location[]> {
        return Result.collect(
            rows.map(row => {
                const { err, val } = decrypt(row.name, auth.key);
                if (err) return Result.err(err);
                return Result.ok(
                    new Location(
                        row.id,
                        row.created,
                        row.createdTZOffset,
                        val,
                        row.latitude,
                        row.longitude,
                        row.radius
                    )
                );
            })
        );
    }
}
