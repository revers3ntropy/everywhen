import { query } from '$lib/db/mysql.server';
import { nowUtc } from '$lib/utils/time';

export class SSLogger {
    constructor(
        public name: string,
        private context: Record<string, unknown> = {},
        private userId: string | null = null
    ) {}

    public withUserId(userId: string) {
        return new SSLogger(this.name, { ...this.context }, userId);
    }

    public async writeLog(
        message: string,
        level: string,
        context: Record<string, unknown>,
        fromClient: boolean
    ) {
        const contextFmt = JSON.stringify({ ...this.context, ...context });
        await query.unlogged`
            INSERT INTO logs (userId, created, level, fromClient, message, context) 
            VALUES (
                ${this.userId},
                ${nowUtc()},
                ${level},
                ${fromClient},
                ${message},
                ${contextFmt}
            )
        `;
    }

    public async log(message: string, context: Record<string, unknown> = {}) {
        await this.writeLog(message, 'INFO', context, false);
    }

    public async warn(message: string, context: Record<string, unknown> = {}) {
        await this.writeLog(message, 'WARN', context, false);
    }

    public async error(message: string, context: Record<string, unknown> = {}) {
        await this.writeLog(message, 'ERROR', context, false);
    }
}
