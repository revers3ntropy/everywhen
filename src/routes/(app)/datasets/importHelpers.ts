import { notify } from '$lib/components/notifications/notifications';
import type { PresetId } from '$lib/controllers/dataset/presets';
import { datasetPresets } from '$lib/controllers/dataset/presets';
import { dispatch } from '$lib/dataChangeEvents';
import { api, apiPath } from '$lib/utils/apiRequest';
import { Result } from '$lib/utils/result';
import { currentTzOffset, nowUtc } from '$lib/utils/time';

export async function makeFromPreset(presetId: PresetId): Promise<Result<string>> {
    const preset = datasetPresets[presetId];
    if (!preset) {
        return Result.err('Invalid preset');
    }
    const res = await api.post('/datasets', {
        name: datasetPresets[presetId].defaultName,
        presetId
    });
    if (!res.ok) return res.cast();
    const { id } = res.val;

    await dispatch.create('dataset', {
        id,
        preset,
        name: datasetPresets[presetId].defaultName,
        columns: preset.columns,
        created: nowUtc(),
        rowCount: 0,
        showInFeed: false
    });

    notify.success('Dataset created');

    return Result.ok(id);
}

export async function makeBlank(usedNames: string[]): Promise<string> {
    let name = 'Blank';

    let i = 1;
    while (usedNames.includes(name)) {
        name = `Blank ${i}`;
        i++;
    }

    const { id } = notify.onErr(
        await api.post('/datasets', {
            name,
            presetId: null
        })
    );

    await dispatch.create('dataset', {
        id,
        preset: null,
        name,
        columns: [],
        rowCount: 0,
        created: nowUtc(),
        showInFeed: false
    });

    notify.success('Dataset created');

    return id;
}

/**
 * @param {string} data - csv of sleep data, unedited from SleepCycle export
 * @param {string} sleepDatasetId
 * @returns {Promise<Result<number>>} number of created rows
 */
export async function importFromSleepCycle(
    data: string,
    sleepDatasetId: string
): Promise<Result<number>> {
    const lines = data.split('\n');
    const [header, ...dataLines] = lines;

    const columns = header.split(',');
    const startTsIdx = columns.indexOf('Went to bed');
    const durationIdx = columns.indexOf('Time in bed (seconds)');
    const timeAsleepIdx = columns.indexOf('Time asleep (seconds)');
    const asleepAfterIdx = columns.indexOf('Asleep after (seconds)');
    const sleepQualityIdx = columns.indexOf('Sleep Quality');
    const regularityIdx = columns.indexOf('Regularity');

    const rows = [];

    for (const lines of dataLines) {
        const linesParts = lines.split(',');
        const startTs = linesParts[startTsIdx];

        let sleepQuality: number | null = Math.min(
            1,
            parseFloat(linesParts[sleepQualityIdx]) / 100
        );
        if (isNaN(sleepQuality)) sleepQuality = null;
        let regularity: number | null = parseFloat(linesParts[regularityIdx]) / 100;
        if (isNaN(regularity)) regularity = null;
        let duration: number | null = parseFloat(linesParts[durationIdx]);
        if (isNaN(duration)) duration = null;
        let asleepAfter: number | null = parseFloat(linesParts[asleepAfterIdx]);
        if (isNaN(asleepAfter)) asleepAfter = null;
        let timeAsleep: number | null = parseFloat(linesParts[timeAsleepIdx]);
        if (isNaN(timeAsleep)) timeAsleep = null;

        const timestamp = new Date(startTs).getTime() / 1000;
        if (isNaN(timestamp)) continue;

        rows.push({
            elements: [duration, sleepQuality, regularity, timeAsleep, asleepAfter],
            created: nowUtc(),
            timestamp,
            timestampTzOffset: currentTzOffset()
        });
    }

    return await batchAddRows(sleepDatasetId, rows);
}

async function batchAddRows(datasetId: string, rows: unknown[]): Promise<Result<number>> {
    let added = 0;
    for (let i = 0; i < rows.length; i += 100) {
        const res = await api.post(apiPath('/datasets/?', datasetId), {
            rows: rows.slice(i, i + 100),
            onSameTimestamp: 'skip'
        });
        if (!res.ok) return res.cast();
        added += res.val.ids.length;
    }
    return Result.ok(added);
}

export async function importSleepFromFitbit(
    files: string[],
    sleepDatasetId: string
): Promise<Result<number>> {
    const sleeps = files
        .map(
            file =>
                JSON.parse(file) as {
                    dateOfSleep: string;
                    startTime: string;
                    endTime: string;
                    duration: number;
                    minutesToFallAsleep: number;
                    minutesAsleep: number;
                    minutesAwake: number;
                    timeInBed: number;
                    efficiency: number;
                    mainSleep: boolean;
                }[]
        )
        .reduce((acc, file) => {
            acc.push(...file);
            return acc;
        }, []);

    const rows = [];

    for (const sleep of sleeps) {
        const sleepQuality: number = Math.min(1, sleep.efficiency / 100);
        const regularity: number | null = null;
        const duration: number = sleep.timeInBed * 60;
        const asleepAfter: number = sleep.minutesAsleep * 60;
        const timeAsleep: number = sleep.minutesAsleep * 60;
        const timestamp = new Date(sleep.startTime).getTime() / 1000;

        rows.push({
            elements: [duration, sleepQuality, regularity, timeAsleep, asleepAfter],
            created: nowUtc(),
            timestamp,
            timestampTzOffset: currentTzOffset()
        });
    }

    return await batchAddRows(sleepDatasetId, rows);
}
