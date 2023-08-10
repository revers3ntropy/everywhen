import { MAX_IMAGE_SIZE } from '$lib/constants';
import { notify } from '$lib/components/notifications/notifications';
import { api } from '$lib/utils/apiRequest';
import { getFileContents } from '$lib/utils/files.client';
import { Result } from '$lib/utils/result';

function imageAsWebP(imageFileContentB64: string): Promise<Result<string>> {
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
        image.onerror = () => {
            resolve(Result.err('Failed to load image'));
        };
        image.src = imageFileContentB64;
    });
}

export async function uploadImages(
    files: FileList | File[]
): Promise<{ publicId: string; id: string; fileName: string }[] | null> {
    if (files.length < 1) {
        return null;
    }
    const fileResults = [] as { publicId: string; id: string; fileName: string }[];

    for (const file of files) {
        const content = notify.onErr(await getFileContents(file, 'b64'));

        if (!content) {
            notify.error('Failed to read file');
            return null;
        }
        const contentAsWebP = notify.onErr(await imageAsWebP(content));

        if (contentAsWebP.length > MAX_IMAGE_SIZE) {
            notify.error('Image is too large');
            return null;
        }

        const { publicId, id } = notify.onErr(
            await api.post('/assets', {
                fileName: file.name,
                content: contentAsWebP
            })
        );

        fileResults.push({ publicId, fileName: file.name, id });
    }

    return fileResults;
}
