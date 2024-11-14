import type { DatasetRow } from '$lib/controllers/dataset/dataset';
import moment from 'moment/moment';
import { dayUtcFromTimestamp, fmtUtc, nowUtc } from '$lib/utils/time';
import type { ChartData, Seconds, TimestampSecs } from '../../../../types';
import { cssVarValue } from '$lib/utils/getCssVar';

export const timeIdxKey = 'time';

export type XAxisKey = typeof timeIdxKey | `col:${number}`;

type Rows = DatasetRow<(number | null)[]>[];

type DatasetGenerationStrategy = (
    sortedEntries: Rows,
    columnIndex: number,
    reductionStrategy: ReductionStrategy
) => Record<string | number, number>;

export enum ChartType {
    Line = 'Line',
    Scatter = 'Scatter'
}

export enum Bucket {
    // hour is a little different in that it only looks at the hour, ignores day
    Hour = 'Hour',
    Day = 'Day',
    Week = 'Week',
    Month = 'Month',
    Year = 'Year'
}

export const bucketNames: Record<string, Bucket> = {
    Year: Bucket.Year,
    Month: Bucket.Month,
    Week: Bucket.Week,
    Day: Bucket.Day,
    Hour: Bucket.Hour
};

export enum ReductionStrategy {
    Sum = 'Sum',
    Mean = 'Mean',
    Count = 'Count',
    Max = 'Max',
    Min = 'Min',
    MeanDefaultPrev = 'MeanDefaultPrev'
}

export const reductionStrategyNames: Record<string, ReductionStrategy> = {
    Sum: ReductionStrategy.Sum,
    Mean: ReductionStrategy.Mean,
    Count: ReductionStrategy.Count,
    Max: ReductionStrategy.Max,
    Min: ReductionStrategy.Min,
    'Mean (default previous)': ReductionStrategy.MeanDefaultPrev
};

const ReductionStrategies: Record<
    ReductionStrategy,
    // previous is null for first item
    (items: (number | null)[], previous: number | null) => number
> = {
    [ReductionStrategy.Sum]: items => items.reduce((a: number, b) => a + (b || 0), 0),
    [ReductionStrategy.Mean]: items => {
        if (items.length === 0) return 0;
        return items.reduce((a: number, b) => a + (b || 0), 0) / items.length;
    },
    [ReductionStrategy.MeanDefaultPrev]: (items, previous) => {
        const filteredItems = items.filter(i => i !== null);
        if (filteredItems.length === 0) return previous ?? 0;
        return filteredItems.reduce((a: number, b: number) => a + b, 0) / filteredItems.length;
    },
    [ReductionStrategy.Count]: items => items.length,
    [ReductionStrategy.Max]: items =>
        items.length ? Math.max(...items.filter((i): i is number => i !== null)) : 0,
    [ReductionStrategy.Min]: items =>
        items.length ? Math.min(...items.filter((i): i is number => i !== null)) : 0
};

export function initialBucket(days: number): Bucket {
    if (days < 7 + 3) return Bucket.Day;
    if (days < 7 * 14) return Bucket.Week;
    if (days < 365 * 10) return Bucket.Month;
    return Bucket.Year;
}

export function initialBucketName(days: number): string {
    return initialBucket(days);
}

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
    }
};

function datasetFactoryForStandardBuckets(selectedBucket: Bucket): DatasetGenerationStrategy {
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

    return (
        sortedRows: Rows,
        columnIndex: number,
        reductionStrategy: ReductionStrategy
    ): Record<string | number, number> => {
        const start = sortedRows[0].timestamp + sortedRows[0].timestampTzOffset * 60 * 60;

        const buckets: Record<string, number[]> = {};

        if (selectedBucket === Bucket.Month) {
            // months do not have constant size
            const end = moment
                .utc(nowUtc() * 1000)
                .add(1, 'month')
                .unix();

            let bucket = bucketiseTime(start, Bucket.Month);
            while (bucket < end) {
                buckets[bucketiseTime(bucket, Bucket.Month).toString()] = [];
                bucket = moment
                    .utc(bucket * 1000)
                    .add(1, 'month')
                    .unix();
            }
        } else {
            const end = nowUtc() + bucketSize(selectedBucket);
            let bucket = bucketiseTime(start, selectedBucket);
            while (bucket < end) {
                buckets[bucketiseTime(bucket, selectedBucket).toString()] = [];
                bucket += bucketSize(selectedBucket);
            }
        }

        for (const row of sortedRows) {
            const bucket = bucketiseTime(
                row.timestamp + row.timestampTzOffset * 60 * 60,
                selectedBucket
            ).toString();
            buckets[bucket].push(row.elements[columnIndex] as number);
        }

        const entries = Object.entries(buckets)
            // sort only so 'previous' is correct, is turned into object again after
            .sort(([a], [b]) => parseInt(a) - parseInt(b));

        const lastBucket = entries.pop()?.[0];
        if (lastBucket && buckets[lastBucket.toString()].length === 0) {
            delete buckets[lastBucket.toString()];
        }

        let previous: number | null = null;
        const reducedBuckets = [];
        for (const [i, items] of entries) {
            const value = ReductionStrategies[reductionStrategy](items, previous);
            reducedBuckets.push([i, value]);
            previous = value;
        }

        return Object.fromEntries(reducedBuckets);
    };
}

const generateDataset: Record<Bucket, DatasetGenerationStrategy> = {
    [Bucket.Hour]: (
        sortedEntries: DatasetRow[],
        columnIndex: number,
        reductionStrategy: ReductionStrategy
    ): Record<string | number, number> => {
        // Entries at 3pm on different days go in the same bucket

        const buckets: number[][] = [];
        for (let i = 0; i < 24; i++) {
            buckets.push([] as number[]);
        }

        for (const row of sortedEntries) {
            const bucket = parseInt(fmtUtc(row.timestamp, row.timestampTzOffset, 'H'));
            buckets[bucket].push(row.elements[columnIndex] as number);
        }

        let previous: number | null = null;
        const reducedBuckets = [];
        for (const items of buckets) {
            const value = ReductionStrategies[reductionStrategy](items, previous);
            reducedBuckets.push(value);
            previous = value;
        }
        return reducedBuckets as Record<number, number>;
    },
    [Bucket.Day]: datasetFactoryForStandardBuckets(Bucket.Day),
    [Bucket.Week]: datasetFactoryForStandardBuckets(Bucket.Week),
    [Bucket.Month]: datasetFactoryForStandardBuckets(Bucket.Month),
    [Bucket.Year]: datasetFactoryForStandardBuckets(Bucket.Year)
};

function generateTimeSeriesData(
    rows: Rows,
    selectedBucket: Bucket,
    columnIndex: number,
    reductionStrategy: ReductionStrategy,
    style: {
        backgroundColor?: string;
        borderColor?: string;
        borderWidth?: number;
        borderRadius?: number;
    } = {}
): ChartData {
    const sortedRows = [...rows].sort((a, b) => a.timestamp - b.timestamp);
    const start = sortedRows[0].timestamp;

    const bucketsMap = generateDataset[selectedBucket](sortedRows, columnIndex, reductionStrategy);
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
                label: 'my title',
                cubicInterpolationMode: 'monotone',
                tension: 0.4,
                pointRadius: 1,
                pointHoverRadius: 3,
                ...style
            }
        ]
    };
}

export function generateScatterData(
    rows: Rows,
    columnIndex: number,
    xAxisKey: XAxisKey,
    style: {
        backgroundColor?: string;
        borderColor?: string;
        borderWidth?: number;
        borderRadius?: number;
    } = {}
): ChartData {
    let rowToDatapointMapper;

    if (xAxisKey === timeIdxKey) {
        rowToDatapointMapper = (row: DatasetRow) => ({
            x: row.timestamp,
            y: row.elements[columnIndex] as number
        });
    } else {
        const xIdx = parseInt(xAxisKey.split(':')[1]);
        rowToDatapointMapper = (row: DatasetRow) => ({
            x: row.elements[xIdx] as number,
            y: row.elements[columnIndex] as number
        });
    }

    const data = rows.map(rowToDatapointMapper);

    return {
        datasets: [
            {
                backgroundColor: cssVarValue('--primary'),
                borderColor: cssVarValue('--primary'),
                data,
                label: 'my title',
                ...style
            }
        ]
    };
}

export function generateChartData(
    rows: Rows,
    selectedBucket: Bucket,
    columnIndex: number,
    xAxisKey: XAxisKey,
    reductionStrategy: ReductionStrategy,
    style: {
        backgroundColor?: string;
        borderColor?: string;
        borderWidth?: number;
        borderRadius?: number;
    } = {}
): [ChartType, ChartData | null] {
    if (rows.length < 1) return [ChartType.Line, null];

    if (xAxisKey === timeIdxKey) {
        return [
            ChartType.Line,
            generateTimeSeriesData(rows, selectedBucket, columnIndex, reductionStrategy, style)
        ];
    }
    return [ChartType.Scatter, generateScatterData(rows, columnIndex, xAxisKey, style)];
}
