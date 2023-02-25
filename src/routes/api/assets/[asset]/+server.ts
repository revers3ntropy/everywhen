import type { RequestHandler } from '@sveltejs/kit';
import { encode } from 'fast-png';

export const GET: RequestHandler = async ({}) => {
    // placeholder image
    const image = encode({
        width: 500,
        height: 500,
        data: new Uint8Array(500 * 500 * 4).fill(255)
    });

    return new Response(image, {
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'max-age=31536000, immutable'
        }
    });
};