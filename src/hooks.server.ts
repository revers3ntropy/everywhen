import type { Handle } from '@sveltejs/kit';
import { con, connect } from './lib/db/mysql';

process.on('SIGINT', process.exit);
process.on('SIGTERM', process.exit);

setInterval(async () => {
    if (!con) await connect();
    con?.ping();
}, 1000 * 60);


// const minificationOptions = {
//     collapseBooleanAttributes: true,
//     collapseWhitespace: true,
//     conservativeCollapse: true,
//     decodeEntities: true,
//     html5: true,
//     ignoreCustomComments: [ /^#/ ],
//     minifyCSS: true,
//     minifyJS: true,
//     removeAttributeQuotes: true,
//     removeComments: true,
//     removeOptionalTags: true,
//     removeRedundantAttributes: true,
//     removeScriptTypeAttributes: true,
//     removeStyleLinkTypeAttributes: true,
//     sortAttributes: true,
//     sortClassName: true,
//     removeEmptyElements: true,
// };

function logRequest (req: Request) {
    console.log(new Date().toLocaleTimeString()
        + ' ' + req.method.padEnd(6, ' ')
        + ' ' + new URL(req.url).pathname);
}

export const handle = (async ({ event, resolve }) => {
    logRequest(event.request);
    return await resolve(event);
}) satisfies Handle;