import type { RequestHandler } from '@sveltejs/kit';
import { query } from '../../../lib/db/mysql';
import { randomString } from '../../../lib/utils';
import { generateUUId } from '../../../lib/security/uuid';

export const POST: RequestHandler = async ({ request }) => {
	const { username, password } = await request.json();

	if (!username || username.length < 3 || typeof username !== 'string') {
		return new Response(JSON.stringify({ error: 'Username must be at least 3 characters' }), {
			status: 400
		});
	}
	if (!password || password.length < 8 || typeof password !== 'string') {
		return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
			status: 400
		});
	}

	let salt = '';
	while (true) {
		salt = randomString(10);
		const res = await query`
            SELECT salt
            FROM users
            WHERE salt = ${salt}
        `;
		if (res.length === 0) {
			break;
		}
	}

	const id = await generateUUId();
	const now = Math.round(Date.now() / 1000);

	await query`
        INSERT INTO users (id, username, password, salt, created)
        VALUES (${id},
                ${username},
                SHA2(${password + salt}, 256),
                ${salt},
                ${now}
        );
    `;

	return new Response(JSON.stringify({}), { status: 200 });
};
