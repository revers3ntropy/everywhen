import moment from 'moment/moment';
import type { Seconds } from '../../lib/utils/types';

export enum By {
    Words,
    Entries
}

export enum Bucket {
    Day,
    Week,
    Month,
    Year,
}

export function bucketiseTime (time: Seconds, bucket: Bucket): Seconds {
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
}

export function bucketSize (bucket: Bucket): Seconds {
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
}