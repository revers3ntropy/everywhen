import type { Event } from '$lib/controllers/event';
import type { Label } from '$lib/controllers/label';
import type { Auth } from '$lib/controllers/user';
import { api, type ReqBody } from '$lib/utils/apiRequest';
import { errorLogger } from '$lib/utils/log';
import type { Notification } from '$lib/notifications/notifications';
import { NotificationType } from '$lib/notifications/notifications';
import { nowUtc } from '$lib/utils/time';
import { matches } from 'schemion';
import type { Mutable } from '../../app';

export async function importEvents(
    contents: string,
    labels: Label[],
    auth: Auth
): Promise<undefined | Partial<Notification> | Partial<Notification>[]> {
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
    const notifications: Partial<Notification>[] = [];

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
                    type: NotificationType.INFO,
                    timeout: 10000
                } as const);
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
            type: NotificationType.SUCCESS
        };
    }

    for (const error of errors) {
        const text = `#${error[0]}: ${error[1]}`;
        errorLogger.error(text);
        notifications.push({ text });
    }

    return notifications;
}
