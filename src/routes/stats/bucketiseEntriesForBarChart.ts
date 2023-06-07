import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
import moment from 'moment/moment';
import type { Seconds, TimestampSecs } from '../../app';
import {
    Bucket,
    bucketiseTime,
    bucketSize,
    By,
    type EntryWithWordCount
} from './helpers';

export interface ChartData {
    datasets: {
        data: number[];
        label: string;
    }[];
    labels: string[];
}

const generateLabelsDayAndWeek = (
    start: TimestampSecs,
    buckets: Seconds[]
): string[] => {
    let year = parseInt(fmtUtc(start, currentTzOffset(), 'YYYY'));
    return buckets.map(k => {
        const thisYear = parseInt(fmtUtc(k, currentTzOffset(), 'YYYY'));
        if (thisYear !== year) {
            year = thisYear;
            return fmtUtc(k, currentTzOffset(), 'Do MMM YYYY');
        }
        return fmtUtc(k, currentTzOffset(), 'Do MMM');
    });
};

const generateLabels: Record<
    Bucket,
    (
        start: TimestampSecs,
        buckets: Seconds[],
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
    [Bucket.Month]: (start: TimestampSecs, buckets: Seconds[]): string[] => {
        let year = parseInt(fmtUtc(start, currentTzOffset(), 'YYYY'));
        return buckets.map(k => {
            const thisYear = parseInt(fmtUtc(k, currentTzOffset(), 'YYYY'));
            if (thisYear !== year) {
                year = thisYear;
                return fmtUtc(k, currentTzOffset(), 'MMM YYYY');
            }
            return fmtUtc(k, currentTzOffset(), 'MMM');
        });
    },
    [Bucket.Year]: (_start: TimestampSecs, buckets: Seconds[]): string[] => {
        return buckets.map(k => fmtUtc(k, currentTzOffset(), 'YYYY'));
    }
};

function datasetFactoryForStandardBuckets(
    selectedBucket: Bucket
): (entries: EntryWithWordCount[], by: By) => [number[], number[]] {
    return (
        sortedEntries: EntryWithWordCount[],
        by: By
    ): [number[], number[]] => {
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

        return [
            Object.values(buckets),
            Object.keys(buckets).map(k => parseInt(k))
        ];
    };
}

const generateDataset: Record<
    Bucket,
    (entries: EntryWithWordCount[], by: By) => [number[], number[]]
> = {
    [Bucket.Hour]: (
        sortedEntries: EntryWithWordCount[],
        by: By
    ): [number[], number[]] => {
        // Entries at 3pm on different days go in the same bucket

        const buckets = Array<number>(24).fill(0);

        for (const entry of sortedEntries) {
            const bucket = parseInt(
                fmtUtc(entry.created, entry.createdTZOffset, 'H')
            );
            buckets[bucket] += by === By.Entries ? 1 : entry.wordCount;
        }

        return [
            Object.values(buckets),
            Object.keys(buckets).map(k => parseInt(k))
        ];
    },
    [Bucket.Day]: datasetFactoryForStandardBuckets(Bucket.Day),
    [Bucket.Week]: datasetFactoryForStandardBuckets(Bucket.Week),
    [Bucket.Month]: datasetFactoryForStandardBuckets(Bucket.Month),
    [Bucket.Year]: datasetFactoryForStandardBuckets(Bucket.Year)
};

export function getGraphData(
    entries: EntryWithWordCount[],
    selectedBucket: Bucket,
    by: By
): ChartData {
    const sortedEntries = entries.sort((a, b) => a.created - b.created);
    const start = sortedEntries[0].created;

    const [data, buckets] = generateDataset[selectedBucket](sortedEntries, by);
    const labels = generateLabels[selectedBucket](
        start,
        buckets,
        selectedBucket
    );
    return {
        labels,
        datasets: [
            {
                data,
                label: by === By.Entries ? 'Entries' : 'Words'
            }
        ]
    };
}
