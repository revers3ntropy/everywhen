import { matches } from 'schemion';
import type { Event } from '../../controllers/event';
import type { Label } from '../../controllers/label';
import type { Auth } from '../../controllers/user';
import { api, type ReqBody } from '../../utils/apiRequest';
import { errorLogger } from '../../utils/log';
import { nowUtc } from '../../utils/time';
import type { Mutable, NotificationOptions } from '../../utils/types';

export async function importEvents(
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
    for (const eventJson of json) {
        i++;

        if (
            !matches(
                eventJson,
                {
                    name: 'string',
                    start: 'number',
                    end: 'number',
                    created: 'number',
                    label: 'string'
                },
                {
                    label: '',
                    created: nowUtc()
                }
            )
        ) {
            errors.push([i, `Wrong schema for event`]);
            continue;
        }

        const postBody: Omit<Mutable<Partial<Event>>, 'label'> & {
            label?: string;
        } & ReqBody = {};

        postBody.name = eventJson.name;
        postBody.start = eventJson.start;
        postBody.end = eventJson.end;
        postBody.created = eventJson.created;

        if (eventJson.label) {
            const labelId = labelHashMap.get(eventJson.label);
            if (!labelId) {
                notifications.push({
                    text: `Creating label ${eventJson.label}`,
                    type: 'info',
                    removeAfter: 10000
                });
                const { err, val: createLabelRes } = await api.post(
                    auth,
                    `/labels`,
                    {
                        name: eventJson.label,
                        colour: '#000000'
                    }
                );
                if (err) {
                    errors.push([
                        i,
                        `failed to create label '${eventJson.label}'`
                    ]);
                    continue;
                }

                postBody.label = createLabelRes.id;
                labelHashMap.set(eventJson.label, createLabelRes.id);
            }
            postBody.label = labelId;
        } else {
            postBody.label = labelHashMap.get(eventJson.label);
        }

        // not a very good solution, but without manually inputting it
        // there isn't really a better default value
        postBody.timezoneUtcOffset ??= 0;

        const { err } = await api.post(auth, `/events`, postBody);
        if (err) {
            errors.push([i, err]);
        }
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
