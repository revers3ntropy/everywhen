import chalk, { type ChalkInstance } from 'chalk';

export class Logger {
    logger = console;
    nameLength: number;
    coloredName: string;

    public constructor(groupName: string, color: ChalkInstance | null = null) {
        this.coloredName = color ? color(groupName) : groupName;
        this.nameLength = groupName.length;
    }

    protected fmt(useUTC: boolean, ...args: unknown[]): string {
        const time = chalk.dim(new Date()[useUTC ? 'toUTCString' : 'toLocaleTimeString']());
        return (
            `${time} [${this.coloredName}] ` +
            args
                .map(arg => {
                    if (typeof arg === 'object') {
                        if (arg instanceof Error) return arg.stack;
                        else return JSON.stringify(arg, null, 4);
                    } else {
                        return arg;
                    }
                })
                .join(' ')
        );
    }

    public log(msg: string, context?: Record<string, unknown>): void {
        this.logger.log(this.fmt(false, msg), context || '');
    }

    public trace(msg: string, context?: Record<string, unknown>): void {
        this.logger.trace(this.fmt(false, msg), context || '');
    }

    public warn(msg: string, context?: Record<string, unknown>): void {
        this.logger.warn(this.fmt(false, msg), context || '');
    }

    public error(msg: string, context?: Record<string, unknown>): void {
        this.logger.error(this.fmt(false, msg), context || '');
    }
}

export const clientLogger = new Logger('CLIENT', chalk.blue);

new Logger('INIT', chalk.blueBright.bgBlack).log('');
