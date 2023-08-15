import { MAX_IMAGE_SIZE } from '$lib/constants';
import { currentlyUploadingAssets } from '$lib/stores';
import { api } from '$lib/utils/apiRequest';
import { getFileContents } from '$lib/utils/files.client';
import { clientLogger } from '$lib/utils/log';
import { Result } from '$lib/utils/result';

export interface Asset {
    id: string;
    publicId: string;
    content: string;
    fileName: string;
    created: number;
}

export type AssetMetadata = Omit<Asset, 'content'>;

export namespace Asset {
    export function generateMarkdownLink(fileName: string, publicId: string): string {
        return `![${fileName}](/api/assets/${publicId})`;
    }

    function imageToWebpUsingCanvas(imageFileContentB64: string): Promise<Result<string>> {
        return new Promise(resolve => {
            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(Result.err('Failed to convert image'));
                    return;
                }
                ctx.drawImage(image, 0, 0);

                const imageWebp = canvas.toDataURL('image/webp');
                const imageWebpNoHeader = imageWebp.replace(
                    /^data:image\/((webp)|(png)|(jpeg)|(jpg));base64,/,
                    ''
                );
                resolve(Result.ok(imageWebpNoHeader));
            };
            image.onerror = e => {
                clientLogger.error(e);
                clientLogger.error('Failed to load image');
                resolve(Result.err('Failed to load image'));
            };
            image.src = imageFileContentB64;
        });
    }

    export interface UploadImageResult {
        id: string;
        publicId: string;
        fileName: string;
    }

    export async function uploadImages(
        files: FileList | File[]
    ): Promise<Result<UploadImageResult>[]> {
        const fileResults = [] as Result<{ publicId: string; id: string; fileName: string }>[];
        if (files.length < 1) return fileResults;

        currentlyUploadingAssets.update(([current, total]) => [current, total + files.length]);

        function finishedUpload(result: Result<UploadImageResult>) {
            currentlyUploadingAssets.update(([current, total]) => [current + 1, total]);
            fileResults.push(result);
        }

        await Promise.allSettled(
            [...files].map(async file => {
                const { val: content, err: readErr } = await getFileContents(file, 'b64');

                if (readErr) {
                    return finishedUpload(Result.err(readErr));
                }

                if (content.length > 1024 * 1024 * 32) {
                    return finishedUpload(Result.err('Image is too large'));
                }

                if (!content) {
                    return finishedUpload(Result.err('Failed to read file'));
                }

                const { val: contentAsWebP, err: webPConvertErr } = await imageToWebpUsingCanvas(
                    content
                );

                if (webPConvertErr) {
                    return finishedUpload(Result.err(webPConvertErr));
                }

                if (contentAsWebP.length > MAX_IMAGE_SIZE) {
                    return finishedUpload(Result.err('Image is too large'));
                }

                (
                    await api.post('/assets', {
                        fileName: file.name,
                        content: contentAsWebP
                    })
                ).match(
                    val =>
                        Result.ok<UploadImageResult>({
                            publicId: val.publicId,
                            fileName: file.name,
                            id: val.id
                        }),
                    err => Result.err<UploadImageResult>(err),
                    (_, r) => finishedUpload(r)
                );
            })
        );

        setTimeout(() => {
            currentlyUploadingAssets.update(([current, total]) => {
                if (current === total) return [0, 0];
                return [current, total];
            });
        }, 2 * 1000);

        return fileResults;
    }
}
