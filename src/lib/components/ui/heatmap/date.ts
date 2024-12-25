/**
 * Get the last day of the month.
 */
export function getMonthEnd(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get the first day of the month.
 */
export function getMonthStart(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the last day of the week.
 */
export function getWeekEnd(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (6 - date.getDay()));
}

export function getWeekIndex(date: Date) {
    const firstWeekday = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const offsetDate = date.getDate() + firstWeekday - 1;

    return Math.floor(offsetDate / 7);
}

/**
 * Get the first day of the week.
 */
export function getWeekStart(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
}

export function normalizeDate(value: unknown) {
    if (value instanceof Date) {
        return value;
    }

    if (typeof value === 'string' || typeof value === 'number') {
        return new Date(value);
    }

    throw new Error('Invalid date value');
}

export function stringifyDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
