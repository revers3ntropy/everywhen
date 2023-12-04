import { FileLogger } from '$lib/utils/log.server';
import { wordCount } from '$lib/utils/text';
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

const logger = new FileLogger('Backup');

export const backupSchema = z.object({
    entries: z.array(
        z.object({
            body: z.string(),
            created: z.number(),
            title: z.string().optional().default(''),
            labelName: z.string().nullable().optional(),
            createdTzOffset: z.number().optional().default(0),
            latitude: z.number().nullable().optional(),
            longitude: z.number().nullable().optional(),
            agentData: z.string().optional().default(''),
            pinned: z.number().nullable().optional(),
            deleted: z.number().nullable().optional(),
            wordCount: z.number().optional(),
            edits: z
                .array(
                    z.object({
                        oldBody: z.string(),
                        created: z.number(),
                        oldTitle: z.string().default(''),
                        oldLabelName: z.string().nullable().optional(),
                        createdTzOffset: z.number().default(0),
                        latitude: z.number().nullable().optional(),
                        longitude: z.number().nullable().optional(),
                        agentData: z.string().default('')
                    })
                )
                .optional()
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
            publicId: z.string().optional(),
            fileName: z.string().optional(),
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
            tzOffset: z.number(),
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
        const entryRes = await Entry.all(auth, {
            deleted: 'both'
        });
        if (!entryRes.ok) return entryRes.cast();
        const eventRes = await Event.all(auth);
        if (!eventRes.ok) return eventRes.cast();
        const labelRes = await Label.all(auth);
        if (!labelRes.ok) return labelRes.cast();
        const assetRes = await Asset.all(auth);
        if (!assetRes.ok) return assetRes.cast();
        const locationRes = await Location.all(auth);
        if (!locationRes.ok) return locationRes.cast();

        // TODO datasets, columns and rows in backups

        return Result.ok({
            entries: entryRes.val.map(
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
                            (
                                edit
                            ): ArrayElement<
                                NonNullable<ArrayElement<Backup['entries']>['edits']>
                            > => ({
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
            labels: labelRes.val.map(
                (label): ArrayElement<Backup['labels']> => ({
                    name: label.name,
                    color: label.color,
                    created: label.created
                })
            ),
            assets: assetRes.val.map(
                (asset): ArrayElement<Backup['assets']> => ({
                    publicId: asset.publicId,
                    fileName: asset.fileName,
                    content: asset.content,
                    created: asset.created
                })
            ),
            events: eventRes.val.map(
                (event): ArrayElement<Backup['events']> => ({
                    name: event.name,
                    labelName: event.label?.name,
                    start: event.start,
                    end: event.end,
                    tzOffset: event.tzOffset,
                    created: event.created
                })
            ),
            locations: locationRes.val.map(
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
            const decryptedRes = decrypt(backupEncrypted, key);
            if (!decryptedRes.ok) return decryptedRes.cast();
            try {
                decryptedData = JSON.parse(decryptedRes.val);
            } catch (e) {
                return Result.err('data must be a valid JSON string');
            }
        }

        const parseRes = backupSchema.safeParse(decryptedData);
        if (!parseRes.success) {
            await logger.error('Invalid backup data', {
                error: parseRes.error
            });
            return Result.err('Backup data is invalid');
        }
        const backup: Backup = parseRes.data;

        // set up labels first

        // keep around for later
        const labelsIndexedByName: Record<string, Label> = {};
        const labels: Label[] = [];

        await Label.purgeAll(auth);
        for (const label of backup.labels) {
            const createRes = await Label.create(auth, label);
            if (!createRes.ok) return createRes.cast();
            labelsIndexedByName[createRes.val.name] = createRes.val;
            labels.push(createRes.val);
        }

        await Entry.purgeAll(auth);
        const entryCreateRes = await Result.collectAsync(
            backup.entries.map(async entry => {
                return await Entry.create(
                    auth,
                    labels,
                    entry.title,
                    entry.body,
                    entry.created || 0,
                    entry.createdTzOffset || 0,
                    entry.pinned ?? null,
                    entry.deleted ?? null,
                    entry.latitude ?? null,
                    entry.longitude ?? null,
                    labelsIndexedByName[entry.labelName || '']?.id ?? null,
                    entry.agentData,
                    entry.wordCount ?? wordCount(entry.body),
                    entry.edits?.map(edit => ({
                        oldTitle: edit.oldTitle,
                        oldBody: edit.oldBody,
                        oldLabelId: labelsIndexedByName[edit.oldLabelName || '']?.id ?? null,
                        created: edit.created,
                        createdTzOffset: edit.createdTzOffset,
                        latitude: edit.latitude ?? null,
                        longitude: edit.longitude ?? null,
                        agentData: edit.agentData
                    })) ?? []
                );
            })
        );
        if (!entryCreateRes.ok) return entryCreateRes.cast();

        await Event.purgeAll(auth);
        const eventCreateRes = await Result.collectAsync(
            backup.events.map(async event => {
                return await Event.create(
                    auth,
                    event.name,
                    event.start,
                    event.end,
                    event.tzOffset,
                    labelsIndexedByName[event.labelName || '']?.id ?? null,
                    event.created
                );
            })
        );
        if (!eventCreateRes.ok) return eventCreateRes.cast();

        await Asset.purgeAll(auth);
        const assetCreateRes = await Result.collectAsync(
            backup.assets.map(async asset => {
                return await Asset.create(
                    auth,
                    asset.content,
                    asset.fileName,
                    // make sure to preserve id as this is
                    // card coded into entries
                    asset.created,
                    asset.publicId
                );
            })
        );
        if (!assetCreateRes.ok) return assetCreateRes.cast();

        await Location.purgeAll(auth);
        const locationCreateRes = await Result.collectAsync(
            backup.locations.map(async location => {
                return await Location.create(
                    auth,
                    location.created,
                    location.name,
                    location.latitude,
                    location.longitude,
                    location.radius
                );
            })
        );
        if (!locationCreateRes.ok) return locationCreateRes.cast();

        return Result.ok(null);
    }

    export function migrate(json: Backup): Result<Backup> {
        json.appVersion ||= '0.0.0';
        const versionRes = SemVer.fromString(json.appVersion);
        if (!versionRes.ok) return versionRes.cast();

        if (versionRes.val.isGreaterThan(currentVersion))
            return Result.err(`Cannot time travel - backup is from the future`);

        if (versionRes.val.isLessThan(SemVer.fromString('0.6.0').unwrap()))
            return Result.err(`Cannot use backups created before v0.6, sorry :/`);

        return Result.ok(json);
    }
}

export const Backup = {
    ..._Backup,
    ...BackupServer
};

export type Backup = _Backup;
