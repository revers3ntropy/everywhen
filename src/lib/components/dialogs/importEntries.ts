import { matches } from 'schemion';
import type { Entry } from '../../controllers/entry';
import type { Label } from '../../controllers/label';
import type { Auth } from '../../controllers/user';
import { api, type ReqBody } from '../../utils/apiRequest';
import { errorLogger } from '../../utils/log';
import type { Mutable, NotificationOptions } from '../../utils/types';

export async function importEntries(
    contents: string,
    labels: Label[],
    auth: Auth
): Promise<
    undefined | Partial<NotificationOptions> | Partial<NotificationOptions>[]
> {
    const labelHashMap = new Map<string, string>();
    labels.forEach(label => {
        labelHashMap.set(label.name, label.id);
    });

    let json: unknown = [];

    try {
        json = JSON.parse(contents);
    } catch (e: unknown) {
        return {
            text: `File was not valid JSON`
        };
    }

    if (!Array.isArray(json)) {
        return {
            text: `Incorrect JSON structure, expected array`
        };
    }

    const errors: [number, string][] = [];
    const notifications: Partial<NotificationOptions>[] = [];

    let i = -1;
    for (const entryJSON of json) {
        i++;

        if (typeof entryJSON !== 'object' || entryJSON === null) {
            errors.push([i, `entry is not object`]);
            continue;
        }

        // be more flexible with the JSON
        if ('time' in entryJSON && typeof entryJSON.time === 'string') {
            entryJSON.time = parseInt(entryJSON.time);
        }
        if ('deleted' in entryJSON && typeof entryJSON.deleted !== 'boolean') {
            entryJSON.deleted = !!entryJSON.deleted;
        }

        if (
            !matches(
                entryJSON,
                {
                    entry: 'string',
                    title: 'string',
                    time: 'number',
                    created: 'number',
                    latitude: 'number',
                    longitude: 'number',
                    location: 'object',
                    types: 'object',
                    label: 'string',
                    deleted: 'boolean',
                    createdTZOffset: 'number'
                },
                {
                    title: '',
                    time: 0,
                    created: 0,
                    latitude: 0,
                    longitude: 0,
                    location: [],
                    types: [],
                    label: '',
                    deleted: false,
                    createdTZOffset: 0
                }
            )
        ) {
            errorLogger.log('entryJSON', entryJSON);
            errors.push([i, `entry is not valid object`]);
            continue;
        }

        const postBody: ReqBody &
            Mutable<Omit<Partial<Entry>, 'label'>> & {
                label?: string;
            } = {};

        if (entryJSON.location && !Array.isArray(entryJSON.location)) {
            errors.push([i, `location is not array`]);
            continue;
        }

        postBody.entry = entryJSON.entry;
        postBody.title = entryJSON.title || '';
        postBody.created = entryJSON.time || entryJSON.created;
        postBody.latitude =
            parseFloat(
                (entryJSON.latitude || entryJSON.location[0]) as string
            ) || 0;
        postBody.longitude =
            parseFloat(
                (entryJSON.longitude || entryJSON.location[1]) as string
            ) || 0;
        postBody.timezoneUtcOffset = entryJSON.createdTZOffset || 0;

        if (
            entryJSON.types &&
            Array.isArray(entryJSON.types) &&
            entryJSON.types.length
        ) {
            const name = entryJSON.types[0] as string;
            if (!labelHashMap.has(name)) {
                notifications.push({
                    text: `Creating label ${name}`,
                    type: 'info',
                    removeAfter: 10000
                });
                const { err, val: createLabelRes } = await api.post(
                    auth,
                    `/labels`,
                    {
                        name,
                        colour: '#000000'
                    }
                );
                if (err) {
                    errors.push([i, `failed to create label ${name}`]);
                    continue;
                }

                postBody.label = createLabelRes.id;
                labelHashMap.set(name, createLabelRes.id);
            } else {
                postBody.label = labelHashMap.get(name);
            }
        }
        postBody.label ||= entryJSON.label;

        const { err } = await api.post(auth, `/entries`, postBody);
        if (err) errors.push([i, err]);
    }

    if (errors.length < 0) {
        return {
            text: `Successfully uploaded entries`,
            type: 'success'
        };
    }

    for (const error of errors) {
        const text = `#${error[0]}: ${error[1]}`;
        errorLogger.error(text);
        notifications.push({ text });
    }

    return notifications;
}
