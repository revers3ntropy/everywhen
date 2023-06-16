import { browser } from '$app/environment';
import chalk, { type ChalkInstance } from 'chalk';
import type { FileHandle } from 'fs/promises';
import { removeAnsi } from './text';

// to make log lines line up
let maxLogNameLen = 0;

export interface Logger<HasFile extends string | null> {
    log: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    logToFile: HasFile extends string
        ? (...args: unknown[]) => Promise<void>
        : never;
}

function fmt(
    useUTC: boolean,
    nameLength: number,
    name: string,
    ...args: unknown[]
): string {
    const time = chalk.dim(
        new Date()[useUTC ? 'toUTCString' : 'toLocaleTimeString']()
    );
    const padding = ' '.repeat(maxLogNameLen - nameLength || 0);
    return (
        `${time} [${name}] ` +
        padding +
        args
            .map(arg => {
                if (typeof arg === 'object') {
                    if (arg instanceof Error) {
                        return arg.stack;
                    }
                    return JSON.stringify(arg);
                } else {
                    return arg;
                }
            })
            .join(' ')
    );
}

export function makeLogger<File extends string | null>(
    name: string,
    color: ChalkInstance = chalk.bold,
    file: File
): Logger<File> {
    if (name.length > maxLogNameLen) {
        maxLogNameLen = name.length;
    }
    const coloredName = color(name);

    let fileHandle: FileHandle | null = null;
    const waitForFileHandle = file
        ? new Promise<void>(resolve => {
              const interval = setInterval(() => {
                  if (fileHandle) {
                      clearInterval(interval);
                      resolve();
                  }
              }, 50);
          })
        : null;

    if (!browser && file) {
        // allow it to be used client and server side
        void import('fs').then(async fs => {
            fileHandle = await fs.promises.open(file, 'a');
        });
    }
    const self = {
        log: (...args: unknown[]) => {
            console.log(fmt(false, name.length, coloredName, ...args));
        },
        warn: (...args: unknown[]) => {
            console.warn(fmt(false, name.length, coloredName, ...args));
        },
        error: (...args: unknown[]) => {
            console.error(fmt(false, name.length, coloredName, ...args));
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
                removeAnsi(fmt(true, name.length, name, ...args)) + '\n'
            );
        }) as File extends string
            ? (...args: unknown[]) => Promise<void>
            : never
    };
    void self.logToFile('SETUP');
    return self;
}

export const debugLogger = makeLogger('DEBUG', chalk.cyanBright, 'general.log');
export const errorLogger = makeLogger('ERR', chalk.red, 'general.log');
