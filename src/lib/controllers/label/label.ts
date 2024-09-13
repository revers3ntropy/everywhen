export interface Label {
    id: string;
    color: string;
    name: string;
    created: number;
}

export interface LabelWithCount extends Label {
    entryCount: number;
    eventCount: number;
    editCount: number;
}
