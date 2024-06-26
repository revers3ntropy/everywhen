import { clientLogger } from '$lib/utils/log';
import moment from 'moment/moment';
import { capitalise } from '$lib/utils/text';
import { dayUtcFromTimestamp, fmtUtc, nowUtc } from '$lib/utils/time';
import { deviceDataFromEntry, type OsGroup, osGroups } from '$lib/utils/userAgent';
import type { LineChartData, Seconds, TimestampSecs } from '../../../types';
import type { EntryStats } from './helpers';
import { Bucket, By } from './helpers';
import { Entry } from '$lib/controllers/entry/entry';
import { cssVarValue } from '$lib/utils/getCssVar';

const generateLabelsDayAndWeek = (start: TimestampSecs, buckets: string[]): string[] => {
    let year = parseInt(fmtUtc(start, 0, 'YYYY'));
    return buckets.map(bucket => {
        const bucketTime = parseInt(bucket);
        const thisYear = parseInt(fmtUtc(bucketTime, 0, 'YYYY'));
        if (thisYear !== year) {
            year = thisYear;
            return fmtUtc(bucketTime, 0, 'Do MMM YYYY');
        }
        return fmtUtc(bucketTime, 0, 'Do MMM');
    });
};

const generateLabels: Record<
    Bucket,
    (start: TimestampSecs, buckets: string[], selectedBucket: Bucket) => string[]
> = {
    [Bucket.Hour]: (): string[] => {
        return Array(24)
            .fill(0)
            .map((_, i) => fmtUtc((i % 24) * 60 * 60, 0, 'ha'));
    },
    [Bucket.Day]: generateLabelsDayAndWeek,
    [Bucket.Week]: generateLabelsDayAndWeek,
    [Bucket.Month]: (start: TimestampSecs, buckets: string[]): string[] => {
        let year = parseInt(fmtUtc(start, 0, 'YY'));
        return buckets.map((bucket, i) => {
            const bucketTime = parseInt(bucket);
            const thisYear = parseInt(fmtUtc(bucketTime, 0, 'YY'));
            if (thisYear !== year || i === 0) {
                year = thisYear;
                return fmtUtc(bucketTime, 0, `MMM 'YY`);
            }
            return fmtUtc(bucketTime, 0, 'MMM');
        });
    },
    [Bucket.Year]: (_start: TimestampSecs, buckets: string[]): string[] => {
        return buckets.map(k => fmtUtc(parseInt(k), 0, 'YYYY'));
    },
    [Bucket.OperatingSystem]: () => osGroups.map(capitalise)
};

function datasetFactoryForStandardBuckets(
    selectedBucket: Bucket
): (entries: EntryStats[], by: By) => Record<string | number, number> {
    function bucketSize(bucket: Bucket): Seconds {
        switch (bucket) {
            case Bucket.Year:
                return 60 * 60 * 24 * 365;
            case Bucket.Month:
                throw new Error('Should not use this function for months');
            case Bucket.Week:
                return 60 * 60 * 24 * 7;
            case Bucket.Day:
                return 60 * 60 * 24;
        }
        throw new Error(`Invalid bucket ${bucket}`);
    }

    function bucketiseTime(time: Seconds, bucket: Bucket): Seconds {
        const date = moment.utc(time * 1000);
        switch (bucket) {
            case Bucket.Year:
                return date.startOf('year').unix();
            case Bucket.Month:
                return date.startOf('month').unix();
            case Bucket.Week:
                return date.startOf('isoWeek').unix();
            case Bucket.Day:
                return dayUtcFromTimestamp(time, 0);
        }
        throw new Error(`Invalid bucket ${time} ${bucket}`);
    }

    return (sortedEntries: EntryStats[], by: By): Record<string | number, number> => {
        const start = Entry.localTime(sortedEntries[0]);

        const buckets: Record<string, number> = {};

        if (selectedBucket === Bucket.Month) {
            // months do not have constant size
            const end = moment
                .utc(nowUtc() * 1000)
                .add(1, 'month')
                .unix();

            let bucket = bucketiseTime(start, Bucket.Month);
            while (bucket < end) {
                buckets[bucketiseTime(bucket, Bucket.Month).toString()] = 0;
                bucket = moment
                    .utc(bucket * 1000)
                    .add(1, 'month')
                    .unix();
            }
        } else {
            const end = nowUtc() + bucketSize(selectedBucket);
            let bucket = bucketiseTime(start, selectedBucket);
            while (bucket < end) {
                buckets[bucketiseTime(bucket, selectedBucket).toString()] = 0;
                bucket += bucketSize(selectedBucket);
            }
        }

        for (const entry of sortedEntries) {
            const bucket = bucketiseTime(Entry.localTime(entry), selectedBucket).toString();
            buckets[bucket] += by === By.Entries ? 1 : entry.wordCount;
        }

        if (isNaN(Object.values(buckets).reduce((a, b) => a + b, 0))) {
            clientLogger.error('NaN in buckets', { buckets, start, selectedBucket });
        }

        const lastBucket = Object.keys(buckets)
            .map(a => parseInt(a))
            .sort((a, b) => a - b)
            .pop();
        if (lastBucket && buckets[lastBucket.toString()] === 0) {
            delete buckets[lastBucket.toString()];
        }

        return buckets;
    };
}

const generateDataset: Record<
    Bucket,
    (entries: EntryStats[], by: By) => Record<string | number, number>
> = {
    [Bucket.Hour]: (sortedEntries: EntryStats[], by: By): Record<string | number, number> => {
        // Entries at 3pm on different days go in the same bucket

        const buckets = Array<number>(24).fill(0);

        for (const entry of sortedEntries) {
            const bucket = parseInt(fmtUtc(entry.created, entry.createdTzOffset, 'H'));
            buckets[bucket] += by === By.Entries ? 1 : entry.wordCount;
        }

        return buckets as Record<number, number>;
    },
    [Bucket.Day]: datasetFactoryForStandardBuckets(Bucket.Day),
    [Bucket.Week]: datasetFactoryForStandardBuckets(Bucket.Week),
    [Bucket.Month]: datasetFactoryForStandardBuckets(Bucket.Month),
    [Bucket.Year]: datasetFactoryForStandardBuckets(Bucket.Year),
    [Bucket.OperatingSystem]: (
        sortedEntries: EntryStats[],
        by: By
    ): Record<string | number, number> => {
        // Entries at 3pm on different days go in the same bucket

        const buckets = osGroups.reduce(
            (acc, group) => {
                acc[group] = 0;
                return acc;
            },
            {} as Record<OsGroup, number>
        );

        for (const entry of sortedEntries) {
            const { osGroup } = deviceDataFromEntry(entry);
            buckets[osGroup] += by === By.Entries ? 1 : entry.wordCount;
        }

        return buckets;
    }
};

export function getGraphData(
    entries: EntryStats[],
    selectedBucket: Bucket,
    by: By,
    style: {
        backgroundColor?: string;
        borderColor?: string;
        borderWidth?: number;
        borderRadius?: number;
    } = {}
): LineChartData | null {
    if (entries.length < 1) return null;
    const titleLabel = by === By.Entries ? 'Entries' : 'Words';
    const sortedEntries = [...entries].sort((a, b) => a.created - b.created);

    const start = sortedEntries[0].created;

    const bucketsMap = generateDataset[selectedBucket](sortedEntries, by);
    const labels = generateLabels[selectedBucket](start, Object.keys(bucketsMap), selectedBucket);
    return {
        labels,
        datasets: [
            {
                backgroundColor: cssVarValue('--primary'),
                borderColor: cssVarValue('--primary'),
                borderWidth: 1,
                borderRadius: 0,
                data: Object.values(bucketsMap),
                label: titleLabel,
                cubicInterpolationMode: 'monotone',
                tension: 0.4,
                pointRadius: 1,
                pointHoverRadius: 3,
                ...style
            }
        ]
    };
}
