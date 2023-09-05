import { LOG_FILE_NAME } from '$lib/constants';
import { recursivelyTrimAndStringify, removeAnsi } from '$lib/utils/text';
import { Logger } from './log';
import fs from 'fs/promises';

const logFile = fs.open(LOG_FILE_NAME, 'a');
const writeStream = logFile.then(f => f.createWriteStream({}));

async function write(text: string): Promise<void> {
    return new Promise(resolve => {
        void writeStream.then(ws => ws.write(text, () => resolve()));
    });
}

export class FileLogger extends Logger {
    private fmtContext(context?: Record<string, unknown>): string {
        if (!context) return '';
        return ` ${recursivelyTrimAndStringify(context)}`;
    }

    public override async log(msg: string, context?: Record<string, unknown>): Promise<void> {
        super.log(msg, context);
        await write(removeAnsi(this.fmt(true, msg + this.fmtContext(context))) + '\n');
    }

    public override async warn(msg: string, context?: Record<string, unknown>): Promise<void> {
        super.warn(msg, context);
        await write(removeAnsi(this.fmt(true, msg + this.fmtContext(context))) + '\n');
    }

    public override async error(msg: string, context?: Record<string, unknown>): Promise<void> {
        super.error(msg, context);
        await write(removeAnsi(this.fmt(true, msg + this.fmtContext(context))) + '\n');
    }
}
