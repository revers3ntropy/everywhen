import chalk, { type ChalkInstance } from 'chalk';

// to make log lines line up
let maxLogNameLen = 0;

export interface Logger {
    log: (...args: unknown[]) => void,
    warn: (...args: unknown[]) => void,
    error: (...args: unknown[]) => void,
}

function fmt (
    nameLength: number,
    name: string,
    ...args: unknown[]
): string {
    const time = chalk.dim(new Date().toLocaleTimeString());
    const pad = ' '.repeat((maxLogNameLen - nameLength) || 0);
    return `${time} [${name}] ` + pad + args.map((arg) => {
        if (typeof arg === 'object') {
            return JSON.stringify(arg);
        } else {
            return arg;
        }
    }).join(' ');
}

export function makeLogger (
    name: string,
    colour: ChalkInstance = chalk.bold,
): Logger {
    if (name.length > maxLogNameLen) {
        maxLogNameLen = name.length;
    }
    const colouredName = colour(name);
    return {
        log: (...args: unknown[]) => {
            console.log(fmt(name.length, colouredName, ...args));
        },
        warn: (...args: unknown[]) => {
            console.warn(fmt(name.length, colouredName, ...args));
        },
        error: (...args: unknown[]) => {
            console.error(fmt(name.length, colouredName, ...args));
        },
    };
}