import { LOG_FILE_NAME } from '$lib/constants';
import { removeAnsi } from '$lib/utils/text';
import chalk from 'chalk';
import { Logger } from './log';
import fs from 'fs/promises';

const logFile = await fs.open(LOG_FILE_NAME, 'a');

export class FileLogger extends Logger {
    public override async log(...args: unknown[]): Promise<void> {
        super.log(...args);
        await logFile.write(removeAnsi(this.fmt(true, ...args)) + '\n');
    }

    public override async warn(...args: unknown[]): Promise<void> {
        super.warn(...args);
        await logFile.write(removeAnsi(this.fmt(true, ...args)) + '\n');
    }

    public override async error(...args: unknown[]): Promise<void> {
        super.error(...args);
        await logFile.write(removeAnsi(this.fmt(true, ...args)) + '\n');
    }
}

export const errorLogger = new FileLogger('ERR', chalk.red);
