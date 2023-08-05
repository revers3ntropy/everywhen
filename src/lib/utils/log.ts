import chalk, { type ChalkInstance } from 'chalk';

// to make log lines line up
let maxLogNameLen = 0;

export class Logger {
    logger = console;
    nameLength: number;
    coloredName: string;

    public constructor(name: string, color: ChalkInstance) {
        if (name.length > maxLogNameLen) {
            maxLogNameLen = name.length;
        }
        this.coloredName = color(name);
        this.nameLength = name.length;
    }

    protected fmt(useUTC: boolean, ...args: unknown[]): string {
        const time = chalk.dim(new Date()[useUTC ? 'toUTCString' : 'toLocaleTimeString']());
        const padding = ' '.repeat(maxLogNameLen - this.nameLength || 0);
        return (
            `${time} [${this.coloredName}] ` +
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

    public log(...args: unknown[]): void {
        this.logger.info(this.fmt(false, ...args));
    }

    public warn(...args: unknown[]): void {
        this.logger.warn(this.fmt(false, ...args));
    }

    public error(...args: unknown[]): void {
        this.logger.error(this.fmt(false, ...args));
    }
}

export const clientLogger = new Logger('CLIENT', chalk.blue);

new Logger('INIT', chalk.blueBright.bgBlack).log('');
