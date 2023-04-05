import { browser } from '$app/environment';
import chalk, { type ChalkInstance } from 'chalk';
import type { FileHandle } from 'fs/promises';
import { removeAnsi } from './text';

// to make log lines line up
let maxLogNameLen = 0;

export interface Logger {
    log: (...args: unknown[]) => void,
    warn: (...args: unknown[]) => void,
    error: (...args: unknown[]) => void,
    logToFile: (...args: unknown[]) => Promise<void>,
}

function fmt (
    nameLength: number,
    name: string,
    ...args: unknown[]
): string {
    const time = chalk.dim(new Date().toLocaleTimeString());
    const padding = ' '.repeat((maxLogNameLen - nameLength) || 0);
    return `${time} [${name}] ` + padding + args.map((arg) => {
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
    file: string | null = null,
): Logger {
    if (name.length > maxLogNameLen) {
        maxLogNameLen = name.length;
    }
    const colouredName = colour(name);
    let fileHandle: Promise<FileHandle> | null = null;
    if (!browser && file) {
        // allow it to be used client and server side
        fileHandle = import('fs')
            .then(fs => {
                return fs.promises.open(file, 'a');
            });
    }
    const self = {
        log: (...args: unknown[]) => {
            console.log(fmt(name.length, colouredName, ...args));
        },
        warn: (...args: unknown[]) => {
            console.warn(fmt(name.length, colouredName, ...args));
        },
        error: (...args: unknown[]) => {
            console.error(fmt(name.length, colouredName, ...args));
        },
        logToFile: async (...args: unknown[]) => {
            self.log(...args);
            if (browser || !fileHandle) {
                return;
            }
            const line = removeAnsi(fmt(name.length, name, ...args)) + '\n';
            await fileHandle.then(handle => handle.write(line));
        },
    };
    self.logToFile('SETUP');
    return self;
}

export const debugLogger = makeLogger('DEBUG', chalk.cyanBright, 'debug.log');