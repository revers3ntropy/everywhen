import { api } from '$lib/utils/apiRequest';

export namespace CSLogger {
    export async function sendLog(
        message: string,
        level: string,
        context: Record<string, unknown>
    ) {
        return await api.post('/log', { message, context, level });
    }

    export async function info(message: string, context: Record<string, unknown>) {
        return await sendLog(message, 'INFO', context);
    }

    export async function warn(message: string, context: Record<string, unknown>) {
        return await sendLog(message, 'WARN', context);
    }

    export async function error(message: string, context: Record<string, unknown>) {
        return await sendLog(message, 'ERROR', context);
    }
}
