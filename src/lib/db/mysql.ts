import { browser } from '$app/environment';
import { DB, DB_HOST, DB_PASS, DB_PORT, DB_USER } from '$env/static/private';
import chalk from 'chalk';
import mysql from 'mysql2/promise';
import '../require';
import { makeLogger } from '../utils/log';

export type QueryResult =
    | mysql.RowDataPacket[][]
    | mysql.RowDataPacket[]
    | mysql.OkPacket
    | mysql.OkPacket[]
    | mysql.ResultSetHeader
    | Record<string, unknown>[]
    | object[];

const dbLogger = makeLogger('DB', chalk.yellow, 'general.log');

export let dbConnection: mysql.Connection | null = null;

export async function connect() {
    const config = getConfig();
    dbConnection = await mysql.createConnection(config).catch((e: unknown) => {
        void dbLogger.logToFile(`Error connecting to mysql db '${config.database || '?'}'`);
        void dbLogger.logToFile(e);
        throw e;
    });
    void dbLogger.logToFile(`Connected`);
}

export function getConfig(): mysql.ConnectionOptions {
    // define defaults from .env file
    const port = DB_PORT ? parseInt(DB_PORT) : 3306;
    return {
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS,
        database: DB,
        port
    };
}

function logQuery(query: string, params: unknown[], result: unknown, time: Milliseconds) {
    params = params.map(p => {
        if (typeof p === 'string') {
            return `String(${p.length})`;
        } else {
            return JSON.stringify(p);
        }
    });

    const resultStr = Array.isArray(result) ? `Array(${result.length})` : JSON.stringify(result);

    const queryStr = query.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    void dbLogger.logToFile(
        `\`${queryStr}\`` +
            `\n     [${params.join(', ')}]` +
            `\n     (${time.toPrecision(3)}ms) => ${resultStr}`
    );
}

function buildQuery(queryParts: TemplateStringsArray, params: QueryParam[]): [string, unknown[]] {
    params = [...params];
    const query = queryParts.reduce((acc, cur, i) => {
        const str = acc + cur;
        const p = params[i];
        if (p === undefined) {
            return str;
        } else if (Array.isArray(p)) {
            // so you have ?,?,...?,? in your query for each array element
            return str + '?,'.repeat(p.length - 1) + '?';
        } else {
            return str + '?';
        }
    }, '');

    // if it's an array, add all the elements of the array in place as params
    // Flatten 2D arrays
    for (let i = 0; i < params.length; i++) {
        const p = params[i];
        if (Array.isArray(p)) {
            // insert the contents of the sub array into the array at it's index
            params.splice(i, 1, ...(p as QueryParam[]));
        }
    }

    return [query, params];
}

export type QueryParam = string | number | null | boolean | undefined;
type QueryExecutor = <Res extends QueryResult = never>(
    queryParts: TemplateStringsArray,
    ...params: QueryParam[]
) => Promise<Res extends (infer A)[] ? NonFunctionProperties<A>[] : Res>;

export interface QueryFunc extends QueryExecutor {
    unlogged: QueryFunc;
}

export const query = (async <Res extends QueryResult = never>(
    queryParts: TemplateStringsArray,
    ...params: QueryParam[]
): Promise<Res extends (infer A)[] ? NonFunctionProperties<A>[] : Res> => {
    if (browser) throw new Error('Cannot query database from browser');

    const start = performance.now();

    if (!dbConnection) await connect();

    const [query, queryParams] = buildQuery(queryParts, params);

    const result = ((await dbConnection?.query(query, queryParams).catch((e: unknown) => {
        const end = performance.now();
        logQuery(query, queryParams, null, end - start);
        void dbLogger.logToFile(`Error querying mysql db '${DB}'`);
        void dbLogger.logToFile(e);
    })) || [])[0] as Res extends (infer A)[] ? NonFunctionProperties<A>[] : Res;

    const end = performance.now();

    logQuery(query, params, result, end - start);

    return result;
}) as QueryFunc;

query.unlogged = (async <Res extends QueryResult = never>(
    queryParts: TemplateStringsArray,
    ...params: QueryParam[]
): Promise<Res extends (infer A)[] ? NonFunctionProperties<A>[] : Res> => {
    if (browser) throw new Error('Cannot query database from browser');
    if (!dbConnection) await connect();

    const [query, queryParams] = buildQuery(queryParts, params);

    return ((await dbConnection?.query(query, queryParams).catch((e: unknown) => {
        void dbLogger.logToFile(`Error querying mysql db '${DB}'`);
        void dbLogger.logToFile(e);
    })) || [])[0] as Res extends (infer A)[] ? NonFunctionProperties<A>[] : Res;
}) as QueryFunc;

query.unlogged.unlogged = query.unlogged;
