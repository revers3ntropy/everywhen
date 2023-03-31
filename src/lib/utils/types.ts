import type { Position } from 'svelte-notifications';
import type { Event } from '../controllers/event';

export interface NotificationOptions {
    id?: string;
    text?: string;
    position: Position;
    type?: string;
    removeAfter?: number;
}

export type Mutable<T> = {
    -readonly [P in keyof T]: T[P]
};
type NonFunctionPropertyNames<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
export type PickOptionalAndMutable<A, B extends keyof A> =
    NonFunctionProperties<Omit<Readonly<A>, B>
                          & Partial<Mutable<Pick<A, B>>>>;
export type PickOptional<A, B extends keyof A = keyof A> =
    NonFunctionProperties<Omit<A, B>
                          & Partial<Pick<A, B>>>;

export type Bytes = number;
export type Pixels = number;
export type Hours = number;
export type Seconds = number;
export type TimestampSecs = number;
export type Milliseconds = number;

export type EventsSortKey = keyof Omit<Event, 'id' | 'decrypted'>;