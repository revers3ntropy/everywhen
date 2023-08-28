export interface Label {
    id: string;
    color: string;
    name: string;
    created: number;
}

export type LabelWithCount = Label & {
    entryCount: number;
    eventCount: number;
};
