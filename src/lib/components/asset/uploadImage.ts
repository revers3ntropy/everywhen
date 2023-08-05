import { MAX_IMAGE_SIZE } from '$lib/constants';
import { displayNotifOnErr, notify } from '$lib/components/notifications/notifications';
import { api } from '$lib/utils/apiRequest';
import { getFileContents } from '$lib/utils/files.client';

export async function uploadImage(
    files: FileList
): Promise<{ publicId: string; id: string; fileName: string } | null> {
    if (files.length < 1) {
        return null;
    }
    if (files.length !== 1) {
        notify.error('Please select exactly one file');
        return null;
    }

    const [file] = files;
    const content = displayNotifOnErr(await getFileContents(file, 'b64'));

    if (!content) {
        notify.error('Failed to read file');
        return null;
    }
    if (content.length > MAX_IMAGE_SIZE) {
        notify.error('Image is too large');
        return null;
    }

    const { publicId, id } = displayNotifOnErr(
        await api.post('/assets', {
            fileName: file.name,
            content
        })
    );

    return { publicId, fileName: file.name, id };
}
