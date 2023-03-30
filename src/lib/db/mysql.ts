import { browser } from '$app/environment';
import { DB, DB_HOST, DB_PASS, DB_PORT, DB_USER } from '$env/static/private';
import mysql from 'mysql2/promise';
import '../require';


export type queryRes =
    | mysql.RowDataPacket[][]
    | mysql.RowDataPacket[]
    | mysql.OkPacket
    | mysql.OkPacket[]
    | mysql.ResultSetHeader
    | Record<string, any>[];

async function getConfig () {
    // define defaults from .env file
    const port = DB_PORT ? parseInt(DB_PORT) : 3306;
    const config: mysql.ConnectionOptions = {
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS,
        database: DB,
        port,
    };
    return config;
}

export let con: mysql.Connection | null = null;

export async function connect () {
    const config = await getConfig();
    con = await mysql.createConnection(config).catch((e: any) => {
        console.error(`Error connecting to mysql db '${config.database}'`);
        console.error(e);
        throw e;
    });
    console.log(`Connected to database`);
}


export type QueryFunc = <Res extends queryRes = mysql.RowDataPacket[]>(
    queryParts: TemplateStringsArray,
    ...params: (string | number | null | boolean)[]
) => Promise<Res>;

export async function query<Res extends queryRes = mysql.RowDataPacket[]> (
    queryParts: TemplateStringsArray,
    ...params: any[]
): Promise<Res> {
    if (browser) {
        throw new Error('Cannot query database from browser');
    }
    if (!con) {
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

    // logs query but without whitespace
    // const queryToLog = con?.escape(queryParts)
    // 	.replace(/\s+/g, ' ')
    // 	.replace('\\n', '')
    // 	.replace('\n', '');
    // console.log(`QUERY: ${queryToLog} ${JSON.stringify(params)}`);

    // if it's an array, add all the elements of the array in place as params
    // Flatten 2D arrays
    for (let i = 0; i < params.length; i++) {
        if (Array.isArray(params[i])) {
            // insert the contents of the sub array into the array at it's index
            params.splice(i, 1, ...params[i]);
        }
    }

    return <Res>((await con?.query(query, params)) || [])[0];
}
