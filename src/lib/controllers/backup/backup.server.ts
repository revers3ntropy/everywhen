import { Location } from '$lib/controllers/location/location';
import { SemVer } from '$lib/utils/semVer';
import schemion from 'schemion';
import type { QueryFunc } from '$lib/db/mysql.server';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { nowUtc } from '$lib/utils/time';
import { Entry } from '../entry/entry';
import { Event } from '../event/event';
import { Label } from '../label/label';
import type { IBackup } from './backup';
import type { Auth } from '$lib/controllers/auth/auth';
import { Asset } from '$lib/controllers/asset/asset.server';

export namespace BackupControllerServer {
    export function asEncryptedString(self: IBackup, key: string): string {
        return encrypt(JSON.stringify(self), key);
    }

    export async function generate(
        query: QueryFunc,
        auth: Auth,
        created?: number
    ): Promise<Result<IBackup>> {
        const { err: entryErr, val: entries } = await Entry.all(query, auth, {
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
                // not `null`
                latitude: entry.latitude ?? undefined,
                longitude: entry.longitude ?? undefined,
                title: entry.title,
                agentData: entry.agentData,
                flags: entry.flags,
                edits:
                    entry.edits?.map(edit => ({
                        entry: edit.entry,
                        created: edit.created,
                        createdTZOffset: edit.createdTZOffset,
                        label: edit.label?.name,
                        latitude: edit.latitude ?? undefined,
                        longitude: edit.longitude ?? undefined,
                        title: edit.title,
                        agentData: edit.agentData
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
        query: QueryFunc,
        auth: Auth,
        backupEncrypted: string,
        key: string
    ): Promise<Result> {
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

        for (const label of labels) {
            if (!Label.jsonIsRawLabel(label)) {
                return Result.err('Invalid label format in JSON');
            }

            const { err } = await Label.create(query, auth, label);
            if (err) return Result.err(err);
        }

        await Entry.purgeAll(query, auth);

        for (const entry of entries) {
            if (!Entry.jsonIsRawEntry(entry)) {
                return Result.err('Invalid entry format in JSON');
            }

            if (entry.label) {
                const { err, val } = await Label.getIdFromName(query, auth, entry.label);
                if (err) return Result.err(err);
                entry.label = val;
            }

            const { err } = await Entry.create(query, auth, entry);
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

    export function migrate(json: Partial<IBackup> & Record<string, unknown>): Result<IBackup> {
        json.appVersion ||= '0.0.0';
        const { val: version, err } = SemVer.fromString(json.appVersion);
        if (err) return Result.err(err);

        if (version.isGreaterThan(SemVer.fromString('1.0.0').val, true)) {
            return Result.err(`Cannot time travel to version 1`);
        }

        if (version.isLessThan(SemVer.fromString('0.4.72').val)) {
            // entry.deleted -> entry.flags
            if (json.entries) {
                for (const entry of json.entries) {
                    const e: typeof entry & { deleted?: boolean } = entry;
                    e.flags ??= Entry.Flags.NONE;
                    if (e.deleted) {
                        e.flags |= Entry.Flags.DELETED;
                    }
                    delete e.deleted;
                }
            }
        }

        return Result.ok(json as IBackup);
    }
}
