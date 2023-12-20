import { Marked, type Token } from 'marked';
import PdfDocument from 'pdfkit';

export class PdfBuilder {
    private doc: typeof PdfDocument;

    constructor() {
        this.doc = new PdfDocument({
            size: 'A4',
            bufferPages: true,
            margins: {
                top: 72,
                bottom: 72,
                left: 72,
                right: 72
            },
            info: {
                Title: 'Journal Entries'
            },
            font: 'Times-Roman'
        });
    }

    public finish(): Buffer {
        this.doc.end();
        return Buffer.from(this.doc.read());
    }

    public h1(text: string): void {
        this.doc.fontSize(20);
        this.doc.text(text);
    }

    public h2(text: string): void {
        this.doc.fontSize(16);
        this.doc.text(text);
    }

    public p(text: string): void {
        this.doc.fontSize(12);
        this.doc.text(text);
    }

    public pIndented(text: string): void {
        this.doc.fontSize(12);
        this.doc.text(text, {
            indent: 9
        });
    }

    public space(amount = 1): void {
        this.doc.moveDown(amount);
    }

    public async image(path: string): Promise<void> {
        if (path.startsWith('/')) {
            // extract image public id and do not allow anything else
            const match = path.match(/^\/api\/assets\/([A-Za-z0-9]+)$/);
            if (!match) return;
            const assetId = match[1];
            console.log('!!!', assetId);
            return;
        }

        // fetch external image
        const res = await fetch(path);
        const buffer = Buffer.from(await res.arrayBuffer());
        console.log(buffer);
        this.doc.image(buffer);
    }

    public async markdown(markdown: string): Promise<void> {
        const marked = new Marked();

        const visited = new Set<Token>();
        marked.use({
            walkTokens: (token: Token) => {
                if (visited.has(token)) return;
                visited.add(token);
            }
        });
        await marked.parse(markdown);

        const removeAllChildTokens = (token: Token) => {
            if ('tokens' in token) {
                token.tokens?.forEach(t => {
                    removeAllChildTokens(t);
                    visited.delete(t);
                });
            }

            if (token.type === 'list') {
                ((token.items || []) as Token[]).forEach(t => {
                    removeAllChildTokens(t);
                    visited.delete(t);
                });
            }
        };

        // clean nodes so only useful ones are left
        for (const token of visited) {
            removeAllChildTokens(token);
        }

        const render = async (token: Token) => {
            switch (token.type) {
                case 'paragraph':
                    for (const t of token.tokens || []) await render(t);
                    break;
                case 'list':
                    for (const t of token.items || []) await render(t as Token);
                    break;
                case 'space':
                case 'hr':
                    this.space();
                    break;
                case 'image':
                    await this.image(token.href as string);
                    break;
                case 'text':
                case 'em':
                case 'del':
                case 'code':
                case 'codespan':
                case 'strong':
                    this.p(token.text as string);
                    break;
                case 'heading':
                    this.h1(token.text as string);
                    break;
                case 'list_item':
                    this.pIndented(token.text as string);
                    break;
                default:
                    console.log('UNKNOWN', token);
                    break;
            }
        };

        for (const token of visited) {
            console.log(token);
            await render(token);
        }
    }
}
