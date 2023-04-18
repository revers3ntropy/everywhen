import { browser } from '$app/environment';
import chalk, { type ChalkInstance } from 'chalk';
import type { FileHandle } from 'fs/promises';
import { removeAnsi } from './text';

// to make log lines line up
let maxLogNameLen = 0;

export interface Logger<HasFile extends boolean> {
    log: (...args: unknown[]) => void,
    warn: (...args: unknown[]) => void,
    error: (...args: unknown[]) => void,
    logToFile: HasFile extends true ? (...args: unknown[]) => Promise<void> : never,
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

export function makeLogger<File extends boolean> (
    name: string,
    colour: ChalkInstance = chalk.bold,
    file: File extends true ? string : null = null as File extends true ? string : null,
): Logger<File> {
    if (name.length > maxLogNameLen) {
        maxLogNameLen = name.length;
    }
    const colouredName = colour(name);

    let fileHandle: FileHandle | null = null;
    let waitForFileHandle = file ? new Promise<void>(resolve => {
        const interval = setInterval(() => {
            if (fileHandle) {
                clearInterval(interval);
                resolve();
            }
        }, 50);
    }) : null;

    if (!browser && file) {
        // allow it to be used client and server side
        import('fs')
            .then(async fs => {
                fileHandle = await fs.promises.open(file, 'a');
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
        logToFile: (async (...args) => {
            self.log(...args);

            if (!browser && !fileHandle) {
                await waitForFileHandle;
            }

            if (browser || !fileHandle) {
                return;
            }
            await fileHandle.write(
                removeAnsi(fmt(name.length, name, ...args)) + '\n',
            );
        }) as File extends true ? (...args: unknown[]) => Promise<void> : never,
    };
    self.logToFile('SETUP');
    return self;
}

export const debugLogger = makeLogger('DEBUG', chalk.cyanBright, 'debug.log');