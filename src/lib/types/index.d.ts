import { Position } from "svelte-notifications";

export interface NotificationOptions {
    id?: string;
    text?: string;
    position: Position;
    type?: string;
    removeAfter?: number;
}