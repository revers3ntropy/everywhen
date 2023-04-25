import { errorLogger } from './log';
import { Result } from './result';

function readFileAsB64(file: File): Promise<Result<string>> {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(Result.ok(reader.result?.toString() || ''));
        };
        reader.onerror = err => {
            errorLogger.log(err);
            resolve(Result.err('Error reading file'));
        };
        reader.readAsDataURL(file);
    });
}

export async function getFileContents(
    file: File,
    encoding: 'UTF-8' | 'b64' = 'UTF-8'
): Promise<Result<string>> {
    if (encoding === 'b64') {
        return await readFileAsB64(file);
    }
    return await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = evt => {
            const res = evt.target?.result?.toString?.();
            if (!res && res !== '') {
                resolve(Result.err('Error reading file'));
            }
            resolve(Result.ok(res || ''));
        };
        reader.onerror = () => {
            resolve(Result.err('Error reading file'));
        };
        reader.readAsText(file, encoding);
    });
}

export function download(filename: string, text: string): void {
    const element = document.createElement('a');
    const elData = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
    element.setAttribute('href', elData);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
