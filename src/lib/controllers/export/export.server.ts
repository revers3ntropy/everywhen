import { Asset } from '$lib/controllers/asset/asset.server';
import type { Auth } from '$lib/controllers/auth/auth';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Day } from '$lib/utils/day';
import { Result } from '$lib/utils/result';
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
        return markdown
            .replace(/!\[(.*?)]\(\/api\/assets\/(.*?)\)/g, (md, alt, id) => {
                console.log('!!!', id);
                const asset = images.find(i => i.publicId === id);
                if (!asset) return md;
                return `<img src="data:image/webp;base64,${asset.content}" alt="${alt}" />`;
            })
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/\S+)/g, '<a href="$1">$1</a>');
    }

    function entryHtml(images: Asset[], entry: Entry): string {
        return `
            <div class="entry">
                <div class="entry-header">
                    ${fmtUtc(entry.created, entry.createdTzOffset, 'HH:mm')}
                </div>
                <div class="entry-body">
                    ${markdownToHtml(images, entry.body)}
                </div>
            </div>
        `;
    }

    function dayHtml(images: Asset[], day: Day, entries: Entry[]): string {
        return `
            <div class="day">
                <h1 id="${day.fmtIso()}" class="day-header">
                    ${fmtUtc(day.utcTimestamp(0), 0, 'dddd Do MMMM YYYY')}
                </h1>
                <div class="day-content">
                     ${entries.map(e => entryHtml(images, e)).join('')}
                </div>
            </div>
        `;
    }

    export async function generateHTML(auth: Auth): Promise<Result<string>> {
        const entries = await Entry.all(auth);
        if (!entries.ok) return entries.cast();

        const daysMap: Record<string, Entry[]> = {};

        for (const entry of entries.val) {
            const day = Day.fromTimestamp(entry.created, entry.createdTzOffset).fmtIso();
            if (!daysMap[day]) daysMap[day] = [];
            daysMap[day].push(entry);
        }

        const days = Object.entries(daysMap)
            .map(([day, entries]): [Day, Entry[]] => [Day.fromString(day).unwrap(), entries])
            .sort(([a], [b]) => (a.gt(b) ? 1 : -1));

        const images = await Asset.all(auth);
        if (!images.ok) return images.cast();

        return Result.ok(`
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <title>Everywhen Export</title>
                    <style>
                        ${STYLESHEET}
                    </style>
                </head>
                <body>
                    <main>
                        ${days.map(([day, entries]) => dayHtml(images.val, day, entries)).join('')}
                    </main>
                </body>
            </html>
        
        `);
    }
}
