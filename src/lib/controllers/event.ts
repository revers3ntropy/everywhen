import type { Label } from "./label";

export class Event {
    public constructor (
        public id: number,
        public name: string,
        public start: number,
        public end: number,
        public label?: Label,
    ) {}
}

export type RawEvent = Omit<Event, "label"> & {
    label?: string
};