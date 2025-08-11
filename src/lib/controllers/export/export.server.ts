import { Asset } from '$lib/controllers/asset/asset.server';
import type { Auth } from '$lib/controllers/auth/auth';
import { Entry } from '$lib/controllers/entry/entry.server';
import { query } from '$lib/db/mysql.server';
import { Day } from '$lib/utils/day';
import { decrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { TempFile } from '$lib/utils/tempFile.server';
import { fmtUtc } from '$lib/utils/time';

export namespace Export {
    const STYLESHEET = `
        * {
            margin: 0;
            padding: 0;
        }
        
        main {
            padding: 1rem;
        }
        
        code {
            background-color: #f4f4f4;
            padding: 0.1rem 0.25rem;
            border-radius: 3px;
            font-family: monospace;
        }
        
        .entry {
            padding-bottom: 1rem;
        }
        .entry-header {
            font-weight: bold;
            padding-bottom: 0.25rem;
        }
        
        .day {
            padding-bottom: 2rem;
        }
        .day-header {
            padding-bottom: 0.5rem;
            font-size: 1.2rem;
        }
    `;

    function markdownToHtml(images: Asset[], markdown: string): string {
        return (
            markdown
                .replace(/!\[(.*?)]\(\/api\/assets\/(.*?)\)/g, (md, alt, id) => {
                    const asset = images.find(i => i.publicId === id);
                    if (!asset) return md;
                    return `<img src="data:image/webp;base64,${asset.content}" alt="${alt}" />`;
                })
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/~~(.*?)~~/g, '<del>$1</del>')
                // (?: ) makes a non-capturing group
                .replace(/# (.*?)(?:$|\n)/g, '<h1>$1</h1>')
                .replace(/## (.*?)(?:$|\n)/g, '<h2>$1</h2>')
                .replace(/### (.*?)(?:$|\n)/g, '<h3>$1</h3>')
                .replace(/#### (.*?)(?:$|\n)/g, '<h4>$1</h4>')
                .replace(/##### (.*?)(?:$|\n)/g, '<h5>$1</h5>')
                .replace(/###### (.*?)(?:$|\n)/g, '<h6>$1</h6>')
                .replace(/---/g, '<hr>')
                .replace(/```(.*?)```/g, '<code>$1</code>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>')
                .replace(/!\[(.*)]\((.+)\)/g, '<img src="$2" alt="$1">')
                .replace(/\[(.*)]\((.+)\)/g, '<a href="$2">$1</a>')
        );
    }

    function entryHtml(
        auth: Auth,
        images: Asset[],
        entry: { created: number; createdTzOffset: number; body: string }
    ): string {
        return `
            <div class="entry">
                <div class="entry-header">
                    ${fmtUtc(entry.created, entry.createdTzOffset, 'HH:mm')}
                </div>
                <div class="entry-body">
                    ${markdownToHtml(images, decrypt(entry.body, auth.key).unwrap())}
                </div>
            </div>
        `;
    }

    async function generateHtmlInTempFile(
        auth: Auth,
        images: Asset[],
        entryCount: number
    ): Promise<Result<[ReadableStream, number]>> {
        const tempFile = TempFile.create();
        tempFile.append(`
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <title>${auth.username} | Everywhen Export</title>
                    <style>
                        ${STYLESHEET}
                    </style>
                </head>
                <body>
                    <main>
        `);

        const pageSize = 500;

        let currentDay = null;
        for (let offset = 0; offset < entryCount; offset += pageSize) {
            const entries = await query<
                { body: string; created: number; createdTzOffset: number }[]
            >`
                SELECT body, created, createdTzOffset
                FROM entries
                WHERE userId = ${auth.id}
                    AND deleted is NULL
                ORDER BY created
                LIMIT ${pageSize}
                OFFSET ${offset}
            `;
            for (const entry of entries) {
                const dayOfEntry = Day.fromTimestamp(entry.created, entry.createdTzOffset);
                if (!currentDay || !currentDay.eq(dayOfEntry)) {
                    currentDay = dayOfEntry;
                    tempFile.append(`
                        <h1 id="${dayOfEntry.fmtIso()}" class="day-header">
                            ${fmtUtc(dayOfEntry.utcTimestampMiddleOfDay(0), 0, 'dddd Do MMMM YYYY')}
                        </h1>
                    `);
                    // tags are closed at the beginning of the next day
                }
                tempFile.append(entryHtml(auth, images, entry));
            }
        }

        tempFile.append(`
                    </main>
                </body>
            </html>
        `);

        tempFile.deleteOnTimer();

        return Result.ok([tempFile.readIntoStream(), tempFile.fileLength()]);
    }

    export async function generateHTML(auth: Auth): Promise<Result<[ReadableStream, number]>> {
        const { entryCount } = await Entry.counts(auth);
        const images = await Asset.all(auth);
        return generateHtmlInTempFile(auth, images, entryCount);
    }
}
