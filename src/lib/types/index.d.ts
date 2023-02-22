import { Position } from "svelte-notifications";

export interface Label {
    id: string;
    colour: string;
    name: string;
    created: number;
}

export interface Entry {
    id: number;
    title: string;
    entry: string;
    created: number;
    latitude?: number;
    longitude?: number;
    deleted: number | boolean;
    label?: Label;
}

export interface Event {
    id: number;
    name: string;
    start: number;
    end: number;
    label?: Label;
}

export type RawEntry = Omit<Entry, "label"> & { label?: string };
export type RawEvent = Omit<Event, "label"> & { label?: string };

export interface Auth {
    username: string;
    key: string;
}

export type User = Auth & {
    id: string;
};

export type Data = Auth & Record<string, any>;

export interface NotificationOptions {
    id?: string;
    text?: string;
    position: Position;
    type?: string;
    removeAfter?: number;
}