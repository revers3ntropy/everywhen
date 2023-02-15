import type { Entry } from '$lib/types';

export function groupEntriesByDay (entries: Entry[]): Record<number, Entry[]> {
    const grouped: Record<number, Entry[]> = [];

    if (!Array.isArray(entries)) {
        console.error("groupEntriesByDay: entries is not an array:", entries);
        return {};
    }

    entries.forEach((entry) => {
        const day =
            new Date(entry.created * 1000).setHours(0, 0, 0, 0).valueOf() / 1000;
        if (!grouped[day]) {
            grouped[day] = [];
        }
        grouped[day].push(entry);
    });

    // sort each day
    for (const day in grouped) {
        grouped[day].sort((a, b) => b.created - a.created);
    }

    return grouped;
}
