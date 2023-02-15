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

export type RawEntry = Omit<Entry, 'label'> & { label?: string };

export interface Auth {
    username: string;
    key: string;
}

export type User = Auth & {
    id: string;
};

export type Data = Auth & Record<string, any>;