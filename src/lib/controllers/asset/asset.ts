import { MAX_IMAGE_SIZE } from '$lib/constants';
import { currentlyUploadingAssets } from '$lib/stores';
import { api } from '$lib/utils/apiRequest';
import { getFileContents } from '$lib/utils/files.client';
import { Result } from '$lib/utils/result';
import { CSLogger } from '$lib/controllers/logs/logger.client';
import { tryEncryptText } from '$lib/utils/encryption.client';

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
                void CSLogger.error('Failed to load image', { e });
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

        currentlyUploadingAssets.update(v => v + files.length);

        function finishedUpload(result: Result<UploadImageResult>): void {
            currentlyUploadingAssets.update(v => v - 1);
            fileResults.push(result);
        }

        await Promise.allSettled(
            Array.from(files).map(async file => {
                const content = await getFileContents(file, 'b64');

                if (!content.ok) {
                    finishedUpload(content.cast());
                    return;
                }

                if (content.val.length > 1024 * 1024 * 32) {
                    finishedUpload(Result.err('Image is too large'));
                    return;
                }

                if (!content) {
                    finishedUpload(Result.err('Failed to read file'));
                    return;
                }

                const contentAsWebP = await imageToWebpUsingCanvas(content.val);
                if (!contentAsWebP.ok) {
                    finishedUpload(contentAsWebP.cast());
                    return;
                }

                if (contentAsWebP.val.length > MAX_IMAGE_SIZE) {
                    finishedUpload(Result.err('Image is too large'));
                    return;
                }

                const encryptedFileName = tryEncryptText(file.name);
                const encryptedContent = tryEncryptText(contentAsWebP.val);
                finishedUpload(
                    (
                        await api.post('/assets', {
                            fileName: encryptedFileName,
                            content: encryptedContent
                        })
                    ).map(val => ({
                        publicId: val.publicId,
                        fileName: encryptedFileName,
                        id: val.id
                    }))
                );
            })
        );

        return fileResults;
    }
}
