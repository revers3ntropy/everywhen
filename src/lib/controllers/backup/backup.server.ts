import { errorLogger } from '$lib/utils/log.server';
import { z } from 'zod';
import { currentVersion, SemVer } from '$lib/utils/semVer';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { nowUtc } from '$lib/utils/time';
import type { ArrayElement } from '../../../types';
import { Entry } from '../entry/entry.server';
import { Event } from '../event/event.server';
import { Label } from '../label/label.server';
import { Asset } from '$lib/controllers/asset/asset.server';
import { Location } from '$lib/controllers/location/location.server';
import { Backup as _Backup } from './backup';
import type { Auth } from '$lib/controllers/auth/auth';

export const backupSchema = z.object({
    entries: z.array(
        z.object({
            title: z.string(),
            body: z.string(),
            labelName: z.string().nullable().optional(),
            created: z.number(),
            createdTzOffset: z.number(),
            latitude: z.number().nullable().optional(),
            longitude: z.number().nullable().optional(),
            agentData: z.string(),
            pinned: z.number().nullable().optional(),
            deleted: z.number().nullable().optional(),
            wordCount: z.number(),
            edits: z.array(
                z.object({
                    oldTitle: z.string(),
                    oldBody: z.string(),
                    oldLabelName: z.string().nullable().optional(),
                    created: z.number(),
                    createdTzOffset: z.number(),
                    latitude: z.number().nullable().optional(),
                    longitude: z.number().nullable().optional(),
                    agentData: z.string()
                })
            )
        })
    ),
    labels: z.array(
        z.object({
            name: z.string(),
            color: z.string(),
            created: z.number()
        })
    ),
    assets: z.array(
        z.object({
            publicId: z.string(),
            fileName: z.string(),
            content: z.string(),
            created: z.number()
        })
    ),
    events: z.array(
        z.object({
            name: z.string(),
            labelName: z.string().nullable().optional(),
            start: z.number(),
            end: z.number(),
            created: z.number()
        })
    ),
    locations: z.array(
        z.object({
            created: z.number(),
            name: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            radius: z.number()
        })
    ),
    created: z.number(),
    appVersion: z.string()
});

export namespace BackupServer {
    type Backup = _Backup;

    export function asEncryptedString(self: Backup, key: string): string {
        return encrypt(JSON.stringify(self), key);
    }

    export async function generate(auth: Auth): Promise<Result<Backup>> {
        const { err: entryErr, val: entries } = await Entry.Server.all(auth, {
            deleted: 'both'
        });
        if (entryErr) return Result.err(entryErr);
        const { err: eventsErr, val: events } = await Event.Server.all(auth);
        if (eventsErr) return Result.err(eventsErr);
        const { err: labelsErr, val: labels } = await Label.Server.all(auth);
        if (labelsErr) return Result.err(labelsErr);
        const { err: assetsErr, val: assets } = await Asset.Server.all(auth);
        if (assetsErr) return Result.err(assetsErr);
        const { err: locationsErr, val: locations } = await Location.Server.all(auth);
        if (locationsErr) return Result.err(locationsErr);

        // TODO datasets, columns and rows in backups

        return Result.ok({
            entries: entries.map(
                (entry): ArrayElement<Backup['entries']> => ({
                    title: entry.title,
                    body: entry.body,
                    labelName: entry.label?.name,
                    created: entry.created,
                    createdTzOffset: entry.createdTzOffset,
                    latitude: entry.latitude ?? undefined,
                    longitude: entry.longitude ?? undefined,
                    agentData: entry.agentData,
                    pinned: entry.pinned ?? undefined,
                    deleted: entry.deleted ?? undefined,
                    wordCount: entry.wordCount,
                    edits:
                        entry.edits?.map(
                            (edit): ArrayElement<ArrayElement<Backup['entries']>['edits']> => ({
                                oldTitle: edit.oldTitle,
                                oldBody: edit.oldBody,
                                oldLabelName: edit.oldLabel?.name ?? undefined,
                                created: edit.created,
                                createdTzOffset: edit.createdTzOffset,
                                latitude: edit.latitude ?? undefined,
                                longitude: edit.longitude ?? undefined,
                                agentData: edit.agentData ?? undefined
                            })
                        ) || []
                })
            ),
            labels: labels.map(
                (label): ArrayElement<Backup['labels']> => ({
                    name: label.name,
                    color: label.color,
                    created: label.created
                })
            ),
            assets: assets.map(
                (asset): ArrayElement<Backup['assets']> => ({
                    publicId: asset.publicId,
                    fileName: asset.fileName,
                    content: asset.content,
                    created: asset.created
                })
            ),
            events: events.map(
                (event): ArrayElement<Backup['events']> => ({
                    name: event.name,
                    labelName: event.label?.name,
                    start: event.start,
                    end: event.end,
                    created: event.created
                })
            ),
            locations: locations.map(
                (location): ArrayElement<Backup['locations']> => ({
                    created: location.created,
                    name: location.name,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    radius: location.radius
                })
            ),
            created: nowUtc(),
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

        const parseRes = backupSchema.safeParse(decryptedData);
        if (!parseRes.success) {
            await errorLogger.error('Invalid backup data', {
                parseRes
            });
            return Result.err('Backup data is invalid');
        }
        const backup: Backup = parseRes.data;

        // set up labels first

        // keep around for later
        const labelsIndexedByName: Record<string, Label> = {};
        const labels: Label[] = [];

        await Label.Server.purgeAll(auth);
        for (const label of backup.labels) {
            const { err, val } = await Label.Server.create(auth, label);
            if (err) return Result.err(err);
            labelsIndexedByName[val.name] = val;
            labels.push(val);
        }

        await Entry.Server.purgeAll(auth);
        for (const entry of backup.entries) {
            const { err } = await Entry.Server.create(
                auth,
                labels,
                entry.title || '',
                entry.body,
                entry.created || 0,
                entry.createdTzOffset || 0,
                entry.pinned ?? null,
                entry.deleted ?? null,
                entry.latitude ?? null,
                entry.longitude ?? null,
                labelsIndexedByName[entry.labelName || '']?.id ?? null,
                entry.agentData,
                entry.wordCount,
                entry.edits.map(edit => ({
                    oldTitle: edit.oldTitle,
                    oldBody: edit.oldBody,
                    oldLabelId: labelsIndexedByName[edit.oldLabelName || '']?.id ?? null,
                    created: edit.created,
                    createdTzOffset: edit.createdTzOffset,
                    latitude: edit.latitude ?? null,
                    longitude: edit.longitude ?? null,
                    agentData: edit.agentData
                }))
            );
            if (err) return Result.err(err);
        }

        await Event.Server.purgeAll(auth);
        for (const event of backup.events) {
            const { err } = await Event.Server.create(
                auth,
                event.name,
                event.start,
                event.end,
                labelsIndexedByName[event.labelName || '']?.id ?? null,
                event.created
            );
            if (err) return Result.err(err);
        }

        await Asset.Server.purgeAll(auth);
        for (const asset of backup.assets) {
            const { err } = await Asset.Server.create(
                auth,
                asset.content,
                asset.fileName,
                // make sure to preserve id as this is
                // card coded into entries
                asset.created,
                asset.publicId
            );
            if (err) return Result.err(err);
        }

        await Location.Server.purgeAll(auth);
        for (const location of backup.locations) {
            const { err } = await Location.Server.create(
                auth,
                location.created,
                location.name,
                location.latitude,
                location.longitude,
                location.radius
            );
            if (err) return Result.err(err);
        }

        return Result.ok(null);
    }

    export function migrate(json: Backup): Result<Backup> {
        json.appVersion ||= '0.0.0';
        const { val: version, err } = SemVer.fromString(json.appVersion);
        if (err) return Result.err(err);

        if (version.isGreaterThan(currentVersion)) {
            return Result.err(`Cannot time travel - backup is from the future`);
        }

        if (version.isLessThan(SemVer.fromString('0.5.97').unwrap())) {
            return Result.err(`Cannot use backup created before v0.5.97, sorry :/`);
        }

        return Result.ok(json);
    }
}

export const Backup = {
    ..._Backup,
    Server: BackupServer
};

export type Backup = _Backup;
