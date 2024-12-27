import fs from 'fs';
import { createReadableStreamFromReadable } from '@remix-run/node';

export class TempFile {
    static DIR_NAME = 'tmp';

    private constructor(private name: string) {}

    private static pathFromName(name: string): string {
        return `${this.DIR_NAME}/${name}`;
    }

    private static ensureDirExists() {
        if (!fs.existsSync(this.DIR_NAME)) {
            fs.mkdirSync(this.DIR_NAME);
        }
    }

    private static findTempName(): string {
        let i = 0;
        while (i < 100_000) {
            const name = `temp-${i}`;
            const path = TempFile.pathFromName(name);
            if (!fs.existsSync(path)) {
                return name;
            }
            i++;
        }
        throw new Error('Failed to create temp file');
    }

    public static create(): TempFile {
        TempFile.ensureDirExists();
        const name = TempFile.findTempName();
        fs.writeFileSync(TempFile.pathFromName(name), '');
        return new TempFile(name);
    }

    public append(data: string) {
        fs.appendFileSync(TempFile.pathFromName(this.name), data);
    }

    public readIntoStream(): ReadableStream {
        return createReadableStreamFromReadable(
            fs.createReadStream(TempFile.pathFromName(this.name))
        );
    }

    public fileLength(): number {
        return fs.statSync(TempFile.pathFromName(this.name)).size;
    }

    public delete() {
        fs.unlinkSync(TempFile.pathFromName(this.name));
    }
}
