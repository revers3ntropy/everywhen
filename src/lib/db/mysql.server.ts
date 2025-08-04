import mysql, { type FieldPacket } from 'mysql2/promise';
import '../require';
import { DB, DB_HOST, DB_PASS, DB_PORT, DB_USER } from '$env/static/private';
import { collapseWhitespace } from '$lib/utils/text';
import type { Expand, Milliseconds, NonFunctionProperties } from '../../types';
import { SSLogger } from '$lib/controllers/logs/logs.server';

export type QueryResult =
    | mysql.RowDataPacket[][]
    | mysql.RowDataPacket[]
    | mysql.ResultSetHeader
    | Record<string, unknown>[]
    | object[];

export const logger = new SSLogger('MySQL');

export let dbConnection: mysql.Connection | null = null;

export function connect() {
    dbConnection = mysql.createPool(getConfig());
    void logger.log(`Connected`);
}

export function getConfig(): mysql.ConnectionOptions {
    // define defaults from .env file
    const port = DB_PORT ? parseInt(DB_PORT) : 3306;

    return {
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS,
        database: DB,
        port,
        multipleStatements: true,
        charset: 'utf8mb4_bin'
    };
}

async function logQuery(query: string, params: unknown[], result: unknown, time: Milliseconds) {
    if (time > 500) {
        await logger.warn(`very slow query`, {
            query: collapseWhitespace(query),
            time,
            params,
            result
        });
    }
}

function buildQuery(queryParts: TemplateStringsArray, params: QueryParam[]): [string, unknown[]] {
    params = [...params];
    const query = queryParts.reduce((acc, cur, i) => {
        const str = acc + cur;
        const p = params[i];
        if (p === undefined) {
            return str;
        } else if (Array.isArray(p)) {
            if (p.length === 0) throw new Error('Empty array passed to query');
            if (p.length === 1) return str + '?';
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

export type QueryParam =
    | string
    | number
    | null
    | boolean
    | undefined
    | string[]
    | number[]
    | boolean[];

type QueryExecutor = <Res extends QueryResult = never>(
    queryParts: TemplateStringsArray,
    ...params: QueryParam[]
) => Promise<
    Res extends (infer A)[]
        ? Expand<NonFunctionProperties<A>>[]
        : Expand<NonFunctionProperties<Res>>
>;

export interface QueryFunc extends QueryExecutor {
    unlogged: QueryFunc;
}

export const query = (async <Res extends QueryResult = never>(
    queryParts: TemplateStringsArray,
    ...params: QueryParam[]
): Promise<Res> => {
    const start = performance.now();

    if (!dbConnection) connect();

    const [query, queryParams] = buildQuery(queryParts, params);

    const [result, _] = ((await dbConnection?.query(query, queryParams).catch((error: unknown) => {
        const end = performance.now();
        void (async () => {
            await logQuery(query, queryParams, null, end - start);
            await logger.error(`Error querying mysql db '${DB}'`, { error });
        })();
        throw error;
    })) || [[], []]) as [Res, FieldPacket[]];

    const end = performance.now();

    void logQuery(query, params, result, end - start);

    return result;
}) as QueryFunc;

query.unlogged = (async <Res extends QueryResult = never>(
    queryParts: TemplateStringsArray,
    ...params: QueryParam[]
): Promise<Res> => {
    if (!dbConnection) connect();

    const [query, queryParams] = buildQuery(queryParts, params);

    return ((await dbConnection?.query(query, queryParams).catch((error: unknown) => {
        void logQuery(query, queryParams, error, -1);
        void logger.log(`Error querying mysql db '${DB}'`, { error });
        throw error;
    })) || [])[0] as Res;
}) as QueryFunc;

query.unlogged.unlogged = query.unlogged;
