import { Location } from '$lib/controllers/location/location';
import { query } from '$lib/db/mysql.server';
import { SemVer } from '$lib/utils/semVer';
import { wordCount } from '$lib/utils/text';
import schemion from 'schemion';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { nowUtc } from '$lib/utils/time';
import { Entry } from '../entry/entry.server';
import { Event } from '../event/event';
import { Label } from '../label/label';
import { Backup as _Backup } from './backup';
import type { Auth } from '$lib/controllers/auth/auth';
import { Asset } from '$lib/controllers/asset/asset.server';

export namespace BackupServer {
    type Backup = _Backup;

    export function asEncryptedString(self: Backup, key: string): string {
        return encrypt(JSON.stringify(self), key);
    }

    export async function generate(auth: Auth, created?: number): Promise<Result<Backup>> {
        const { err: entryErr, val: entries } = await Entry.Server.all(auth, {
            deleted: 'both'
        });
        if (entryErr) return Result.err(entryErr);
        const { err: eventsErr, val: events } = await Event.all(query, auth);
        if (eventsErr) return Result.err(eventsErr);
        const { err: labelsErr, val: labels } = await Label.all(query, auth);
        if (labelsErr) return Result.err(labelsErr);
        const { err: assetsErr, val: assets } = await Asset.Server.all(auth);
        if (assetsErr) return Result.err(assetsErr);
        const { err: locationsErr, val: locations } = await Location.all(query, auth);
        if (locationsErr) return Result.err(locationsErr);

        return Result.ok({
            entries: entries.map(entry => ({
                // replace the label with the label's name
                // can't use ID as will change when labels are restored
                label: entry.label?.name,
                entry: entry.entry,
                created: entry.created,
                createdTZOffset: entry.createdTZOffset,
                latitude: entry.latitude ?? undefined,
                longitude: entry.longitude ?? undefined,
                title: entry.title,
                agentData: entry.agentData ?? undefined,
                pinned: entry.pinned ?? undefined,
                deleted: entry.deleted ?? undefined,
                wordCount: entry.wordCount,
                edits:
                    entry.edits?.map(edit => ({
                        entry: edit.entry,
                        created: edit.created,
                        createdTZOffset: edit.createdTZOffset,
                        label: edit.label?.name,
                        latitude: edit.latitude ?? undefined,
                        longitude: edit.longitude ?? undefined,
                        title: edit.title,
                        agentData: edit.agentData ?? undefined
                    })) || []
            })),
            labels: labels.map(label => ({
                name: label.name,
                color: label.color,
                created: label.created
            })),
            assets: assets.map(asset => ({
                publicId: asset.publicId,
                fileName: asset.fileName,
                content: asset.content,
                created: asset.created
            })),
            events: events.map(event => ({
                name: event.name,
                label: event.label?.name,
                start: event.start,
                end: event.end,
                created: event.created
            })),
            locations: locations.map(location => ({
                created: location.created,
                createdTZOffset: location.createdTZOffset,
                name: location.name,
                latitude: location.latitude,
                longitude: location.longitude,
                radius: location.radius
            })),
            created: created ?? nowUtc(),
            appVersion: __VERSION__
        });
    }

    export async function restore(
        auth: Auth,
        backupEncrypted: string,
        key: string
    ): Promise<Result<null>> {
        let decryptedData: unknown;
        try {
            decryptedData = JSON.parse(backupEncrypted);
        } catch (e) {
            const { err, val: decryptedRaw } = decrypt(backupEncrypted, key);
            if (err) return Result.err(err);
            try {
                decryptedData = JSON.parse(decryptedRaw);
            } catch (e) {
                return Result.err('data must be a valid JSON string');
            }
        }

        if (typeof decryptedData !== 'object' || decryptedData === null) {
            return Result.err('data must be a non-null object');
        }

        const { err: migrateErr, val: migratedData } = migrate(
            decryptedData as Record<string, unknown>
        );
        if (migrateErr) return Result.err(migrateErr);

        if (
            !schemion.matches(migratedData, {
                entries: 'object',
                labels: 'object',
                assets: 'object',
                events: 'object',
                locations: 'object',
                created: 'number',
                appVersion: 'string'
            })
        ) {
            return Result.err('Invalid backup format');
        }

        const { entries, labels, assets, events, locations } = migratedData;
        if (
            !Array.isArray(entries) ||
            !Array.isArray(labels) ||
            !Array.isArray(assets) ||
            !Array.isArray(events) ||
            !Array.isArray(locations)
        ) {
            return Result.err('data must be an object with entries and labels properties');
        }

        // set up labels first
        await Label.purgeAll(query, auth);

        const createdLabels = [] as Label[];

        for (const label of labels) {
            if (!Label.jsonIsRawLabel(label)) {
                return Result.err('Invalid label format in JSON');
            }

            const { err, val } = await Label.create(query, auth, label);
            if (err) return Result.err(err);
            createdLabels.push(val);
        }

        await Entry.Server.purgeAll(auth);

        for (const entry of entries) {
            if (!Entry.jsonIsRawEntry(entry)) {
                return Result.err('Invalid entry format in JSON');
            }

            if (entry.label) {
                const { err, val } = await Label.getIdFromName(query, auth, entry.label);
                if (err) return Result.err(err);
                entry.label = val;
            }

            const { err } = await Entry.Server.create(
                auth,
                createdLabels,
                entry.title || '',
                entry.entry || '',
                entry.created || 0,
                entry.createdTZOffset || 0,
                entry.pinned || null,
                entry.deleted || null,
                entry.latitude || null,
                entry.longitude || null,
                entry.label || null,
                entry.agentData || '',
                entry.wordCount || wordCount(entry.entry || ''),
                entry.edits || []
            );
            if (err) return Result.err(err);
        }

        await Event.purgeAll(query, auth);

        for (const event of events) {
            if (!Event.jsonIsRawEvent(event)) {
                return Result.err('Invalid event format in JSON');
            }

            if (event.label) {
                const { err, val } = await Label.getIdFromName(query, auth, event.label);
                if (err) return Result.err(err);
                event.label = val;
            }

            const { err } = await Event.create(
                query,
                auth,
                event.name,
                event.start,
                event.end,
                event.label,
                event.created
            );
            if (err) return Result.err(err);
        }

        await Asset.Server.purgeAll(auth);

        for (const asset of assets) {
            if (!Asset.Server.jsonIsRawAsset(asset)) {
                return Result.err('Invalid asset format in JSON');
            }

            const { err } = await Asset.Server.create(
                auth,
                asset.fileName,
                asset.content,
                // make sure to preserve id as this is
                // card coded into entries
                asset.created,
                asset.publicId
            );
            if (err) return Result.err(err);
        }

        await Location.purgeAll(query, auth);

        for (const location of locations) {
            if (!Location.jsonIsRawLocation(location)) {
                return Result.err('Invalid location format in JSON');
            }

            const { err } = await Location.create(
                query,
                auth,
                location.created,
                location.createdTZOffset,
                location.name,
                location.latitude,
                location.longitude,
                location.radius
            );
            if (err) return Result.err(err);
        }

        return Result.ok(null);
    }

    export function migrate(json: Partial<Backup> & Record<string, unknown>): Result<Backup> {
        json.appVersion ||= '0.0.0';
        const { val: version, err } = SemVer.fromString(json.appVersion);
        if (err) return Result.err(err);

        if (version.isGreaterThan(SemVer.fromString('1.0.0').unwrap(), true)) {
            return Result.err(`Cannot time travel to version 1`);
        }

        if (version.isLessThan(SemVer.fromString('0.4.72').unwrap())) {
            // entry.deleted -> entry.flags
            if (json.entries) {
                for (const entry of json.entries) {
                    const e = entry as unknown as typeof entry & {
                        deleted?: boolean;
                        flags?: number;
                    };
                    e.flags ??= 0;
                    if (e.deleted) {
                        e.flags |= 1;
                    }
                    delete e.deleted;
                }
            }
        }

        if (version.isLessThan(SemVer.fromString('0.5.88').unwrap())) {
            // add entry.wordCount
            if (json.entries) {
                for (const entry of json.entries) {
                    entry.wordCount = wordCount(entry.entry);
                }
            }
        }

        if (version.isLessThan(SemVer.fromString('0.5.94').unwrap())) {
            // entry.flags -> entry.deleted, entry.pinned
            if (json.entries) {
                for (const entry of json.entries) {
                    const e: typeof entry & { flags?: number } = entry;
                    e.flags ??= 0;
                    if (e.flags === 0) {
                        delete e.deleted;
                        delete e.pinned;
                    } else if (e.flags === 1) {
                        e.deleted = nowUtc();
                        delete e.pinned;
                    } else if (e.flags === 2) {
                        delete e.deleted;
                        e.pinned = nowUtc();
                    } else if (e.flags === 3) {
                        e.deleted = nowUtc();
                        e.pinned = nowUtc();
                    }
                }
            }
        }

        return Result.ok(json as Backup);
    }
}

export const Backup = {
    ..._Backup,
    Server: BackupServer
};

export type Backup = _Backup;
