import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
import { type OsGroup, osGroupFromEntry, osGroups } from '$lib/utils/userAgent';
import moment from 'moment/moment';
import type { Seconds, TimestampSecs } from '../../app';
import { Bucket, By, type EntryWithWordCount } from './helpers';

export interface ChartData {
    datasets: {
        data: number[];
        label: string;
    }[];
    labels: string[];
}

const generateLabelsDayAndWeek = (
    start: TimestampSecs,
    buckets: string[]
): string[] => {
    let year = parseInt(fmtUtc(start, currentTzOffset(), 'YYYY'));
    return buckets.map(bucket => {
        const bucketTime = parseInt(bucket);
        const thisYear = parseInt(
            fmtUtc(bucketTime, currentTzOffset(), 'YYYY')
        );
        if (thisYear !== year) {
            year = thisYear;
            return fmtUtc(bucketTime, currentTzOffset(), 'Do MMM YYYY');
        }
        return fmtUtc(bucketTime, currentTzOffset(), 'Do MMM');
    });
};

const generateLabels: Record<
    Bucket,
    (
        start: TimestampSecs,
        buckets: string[],
        selectedBucket: Bucket
    ) => string[]
> = {
    [Bucket.Hour]: (): string[] => {
        const today = moment().startOf('day').unix();
        return Array(24)
            .fill(0)
            .map((_, i) => {
                const hour = i % 24;
                const day = Math.floor(i / 24);
                const date = today + day * 24 * 60 * 60;
                return fmtUtc(date + hour * 60 * 60, currentTzOffset(), 'ha');
            });
    },
    [Bucket.Day]: generateLabelsDayAndWeek,
    [Bucket.Week]: generateLabelsDayAndWeek,
    [Bucket.Month]: (start: TimestampSecs, buckets: string[]): string[] => {
        let year = parseInt(fmtUtc(start, currentTzOffset(), 'YYYY'));
        return buckets.map(bucket => {
            const bucketTime = parseInt(bucket);
            const thisYear = parseInt(
                fmtUtc(bucketTime, currentTzOffset(), 'YYYY')
            );
            if (thisYear !== year) {
                year = thisYear;
                return fmtUtc(bucketTime, currentTzOffset(), 'MMM YYYY');
            }
            return fmtUtc(bucketTime, currentTzOffset(), 'MMM');
        });
    },
    [Bucket.Year]: (_start: TimestampSecs, buckets: string[]): string[] => {
        return buckets.map(k => fmtUtc(parseInt(k), currentTzOffset(), 'YYYY'));
    },
    [Bucket.OperatingSystem]: () => osGroups as unknown as string[]
};

function datasetFactoryForStandardBuckets(
    selectedBucket: Bucket
): (entries: EntryWithWordCount[], by: By) => Record<string | number, number> {
    function bucketSize(bucket: Bucket): Seconds {
        switch (bucket) {
            case Bucket.Year:
                return 60 * 60 * 24 * 365;
            case Bucket.Month:
                return 60 * 60 * 24 * 30;
            case Bucket.Week:
                return 60 * 60 * 24 * 7;
            case Bucket.Day:
                return 60 * 60 * 24;
        }
        throw new Error(`Invalid bucket ${bucket}`);
    }

    function bucketiseTime(time: Seconds, bucket: Bucket): Seconds {
        const date = moment(new Date(time * 1000));
        switch (bucket) {
            case Bucket.Year:
                return date.startOf('year').unix();
            case Bucket.Month:
                return date.startOf('month').unix();
            case Bucket.Week:
                return date.startOf('week').unix();
            case Bucket.Day:
                return date.startOf('day').unix();
        }
        throw new Error(`Invalid bucket ${time} ${bucket}`);
    }

    return (
        sortedEntries: EntryWithWordCount[],
        by: By
    ): Record<string | number, number> => {
        const start = sortedEntries[0].created;

        const buckets: Record<string, number> = {};
        const end = nowUtc();
        for (let i = start; i < end; i += bucketSize(selectedBucket)) {
            buckets[bucketiseTime(i, selectedBucket).toString()] = 0;
        }

        for (const entry of sortedEntries) {
            const bucket = bucketiseTime(entry.created, selectedBucket);
            buckets[bucket.toString()] +=
                by === By.Entries ? 1 : entry.wordCount;
        }

        return buckets;
    };
}

const generateDataset: Record<
    Bucket,
    (entries: EntryWithWordCount[], by: By) => Record<string | number, number>
> = {
    [Bucket.Hour]: (
        sortedEntries: EntryWithWordCount[],
        by: By
    ): Record<string | number, number> => {
        // Entries at 3pm on different days go in the same bucket

        const buckets = Array<number>(24).fill(0);

        for (const entry of sortedEntries) {
            const bucket = parseInt(
                fmtUtc(entry.created, entry.createdTZOffset, 'H')
            );
            buckets[bucket] += by === By.Entries ? 1 : entry.wordCount;
        }

        return buckets as Record<number, number>;
    },
    [Bucket.Day]: datasetFactoryForStandardBuckets(Bucket.Day),
    [Bucket.Week]: datasetFactoryForStandardBuckets(Bucket.Week),
    [Bucket.Month]: datasetFactoryForStandardBuckets(Bucket.Month),
    [Bucket.Year]: datasetFactoryForStandardBuckets(Bucket.Year),
    [Bucket.OperatingSystem]: (
        sortedEntries: EntryWithWordCount[],
        by: By
    ): Record<string | number, number> => {
        // Entries at 3pm on different days go in the same bucket

        const buckets = osGroups.reduce((acc, group) => {
            acc[group] = 0;
            return acc;
        }, {} as Record<OsGroup, number>);

        for (const entry of sortedEntries) {
            const bucket = osGroupFromEntry(entry);
            buckets[bucket] += by === By.Entries ? 1 : entry.wordCount;
        }

        return buckets;
    }
};

export function getGraphData(
    entries: EntryWithWordCount[],
    selectedBucket: Bucket,
    by: By
): ChartData {
    const sortedEntries = entries.sort((a, b) => a.created - b.created);
    const start = sortedEntries[0].created;

    const bucketsMap = generateDataset[selectedBucket](sortedEntries, by);
    const labels = generateLabels[selectedBucket](
        start,
        Object.keys(bucketsMap),
        selectedBucket
    );
    return {
        labels,
        datasets: [
            {
                data: Object.values(bucketsMap),
                label: by === By.Entries ? 'Entries' : 'Words'
            }
        ]
    };
}
