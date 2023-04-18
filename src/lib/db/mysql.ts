import { browser } from '$app/environment';
import { DB, DB_HOST, DB_PASS, DB_PORT, DB_USER } from '$env/static/private';
import chalk from 'chalk';
import mysql from 'mysql2/promise';
import { errorLogger } from '../../hooks.server';
import '../require';
import { makeLogger } from '../utils/log';

export type queryRes =
    | mysql.RowDataPacket[][]
    | mysql.RowDataPacket[]
    | mysql.OkPacket
    | mysql.OkPacket[]
    | mysql.ResultSetHeader
    | Record<string, any>[];

const dbLogger = makeLogger('DB', chalk.yellow, 'db.log');

export let dbConnection: mysql.Connection | null = null;

export async function connect () {
    const config = await getConfig();
    dbConnection = await mysql
        .createConnection(config)
        .catch((e: any) => {
            dbLogger.logToFile(`Error connecting to mysql db '${config.database}'`);
            errorLogger.logToFile(`Error connecting to mysql db '${config.database}'`);
            dbLogger.logToFile(e);
            throw e;
        });
    dbLogger.logToFile(`Connected`);
}

export async function getConfig (): Promise<mysql.ConnectionOptions> {
    // define defaults from .env file
    const port = DB_PORT ? parseInt(DB_PORT) : 3306;
    return {
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS,
        database: DB,
        port,
    };
}

export type QueryFunc = <Res extends queryRes = mysql.RowDataPacket[]>(
    queryParts: TemplateStringsArray,
    ...params: (string | number | null | boolean)[]
) => Promise<Res>;

function logQuery (query: string, params: any[]) {
    params = params.map((p) => {
        if (typeof p === 'string') {
            return `String(${p.length})`;
        } else {
            return JSON.stringify(p);
        }
    });

    dbLogger.log(`\`${query.trim()}\`\n     [${params.join(', ')}]`);
}

export async function query<Res extends queryRes = mysql.RowDataPacket[]> (
    queryParts: TemplateStringsArray,
    ...params: any[]
): Promise<Res> {
    if (browser) {
        throw new Error('Cannot query database from browser');
    }
    if (!dbConnection) {
        await connect();
    }

    const query = queryParts.reduce((acc, cur, i) => {
        const str = acc + cur;
        if (params[i] === undefined) {
            return str;
        } else if (Array.isArray(params[i])) {
            // so you have ?,?,...?,? in your query for each array element
            return str + '?,'.repeat(params[i].length - 1) + '?';
        } else {
            return str + '?';
        }
    }, '');

    logQuery(query, params);

    // if it's an array, add all the elements of the array in place as params
    // Flatten 2D arrays
    for (let i = 0; i < params.length; i++) {
        if (Array.isArray(params[i])) {
            // insert the contents of the sub array into the array at it's index
            params.splice(i, 1, ...params[i]);
        }
    }

    return <Res>((await dbConnection?.query(query, params)) || [])[0];
}
