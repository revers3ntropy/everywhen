import { api } from '../../api/apiQuery';
import type { Entry } from '../../controllers/entry';
import type { Label } from '../../controllers/label';
import type { User } from '../../controllers/user';
import type { Mutable, NotificationOptions } from '../../utils';

export async function entries (contents: string, labels: Label[], auth: User)
    : Promise<undefined | NotificationOptions | NotificationOptions[]> {
    if (!labels) {
        return {
            text: `Failed to load labels`,
            position: 'top-center',
            type: 'error',
            removeAfter: 4000
        };
    }

    const labelHashMap = new Map<string, string>();
    labels.forEach((label) => {
        labelHashMap.set(label.name, label.id);
    });

    if (!contents) return {
        text: `Failed to load file`,
        position: 'top-center',
        type: 'error',
        removeAfter: 4000
    };

    let json: unknown = [];

    try {
        json = JSON.parse(contents) as unknown;
    } catch (e: unknown) {
        return {
            text: `File was not valid JSON`,
            position: 'top-center',
            type: 'error',
            removeAfter: 4000
        };
    }

    if (!Array.isArray(json)) {
        return {
            text: `Incorrect JSON structure, expected array`,
            position: 'top-center',
            type: 'error',
            removeAfter: 4000
        };
    }

    let errors: [ number, string ][] = [];

    let notifications: NotificationOptions[] = [];

    let i = -1;
    for (let entryJSON of json) {
        i++;
        if (
            typeof entryJSON !== 'object'
            || Array.isArray(entryJSON)
            || entryJSON === null
        ) {
            errors.push([ i, `entry is not object` ]);
            continue;
        }

        const postBody: Mutable<Partial<Entry>> = {};

        postBody.entry = entryJSON.entry;
        postBody.title = entryJSON.title || '';
        postBody.created = parseInt(entryJSON.time) || entryJSON.created;
        postBody.latitude = parseFloat(entryJSON.latitude || entryJSON.location[0]) || 0;
        postBody.longitude = parseFloat(entryJSON.longitude || entryJSON.location[1]) || 0;

        if (entryJSON.types && entryJSON.types.length) {
            const name = entryJSON.types[0] as string;
            if (!labelHashMap.has(name)) {
                notifications.push({
                    text: `Creating label ${name}`,
                    position: 'top-center',
                    type: 'info',
                    removeAfter: 10000
                });
                const createLabelRes = await api.post(auth, `/labels`, {
                    name,
                    colour: '#000000'
                });

                if (typeof createLabelRes.id !== 'string') {
                    errors.push([ i, `failed to create label ${name}` ]);
                    continue;
                }

                postBody.label = createLabelRes.id as unknown as Label;
                labelHashMap.set(name, createLabelRes.id);
            } else {
                postBody.label = labelHashMap.get(name) as unknown as Label;
            }
        }
        postBody.label ||= entryJSON.label as Label;

        const res = await api.post(auth, `/entries`, postBody);
        if (res.erroneous) {
            errors.push(res.body?.message);
        }
    }

    if (errors.length < 0) {
        return {
            text: `Successfully uploaded entries`,
            position: 'top-center',
            type: 'success',
            removeAfter: 4000
        };
    }

    for (let error of errors) {
        const text = '#' + error[0] + ': ' + error[1];
        console.error(text);
        notifications.push({
            text,
            position: 'top-center',
            type: 'error',
            removeAfter: 4000
        });
    }

    return notifications;
}