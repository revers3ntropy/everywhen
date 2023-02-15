import type { RequestHandler } from '@sveltejs/kit';
import { query } from '$lib/db/mysql';
import { randomString } from '$lib/utils';
import { generateUUId } from '$lib/security/uuid';
import {
	AUTH_COOKIE_OPTIONS,
	KEY_COOKIE_KEY,
	USERNAME_COOKIE_KEY
} from '$lib/constants';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { username, password } = await request.json();

	if (!username || username.length < 3 || typeof username !== "string") {
        return new Response(
            JSON.stringify({ error: "Username must be at least 3 characters" }),
            { status: 400 }
        );
    }
    if (!password || password.length < 8 || typeof password !== "string") {
        return new Response(
            JSON.stringify({ error: "Password must be at least 8 characters" }),
            { status: 400 }
        );
    }

    const existingUsers = await query`
        SELECT *
        FROM users
        WHERE username = ${ username }
    `;
	if (existingUsers.length !== 0) {
        return new Response(JSON.stringify({ error: "Username already exists" }), {
            status: 400
        });
    }

    let salt = "";
	while (true) {
		salt = randomString(10);
        const existingSalts = await query`
            SELECT salt
            FROM users
            WHERE salt = ${ salt }
        `;
		if (existingSalts.length === 0) {
			break;
		}
	}

	const id = await generateUUId();
	const now = Math.round(Date.now() / 1000);

    await query`
        INSERT INTO users (id, username, password, salt, created)
        VALUES (${ id },
                ${ username },
                SHA2(${ password + salt }, 256),
                ${ salt },
                ${ now });
    `;

	cookies.set(KEY_COOKIE_KEY, password, AUTH_COOKIE_OPTIONS);
	cookies.set(USERNAME_COOKIE_KEY, username, AUTH_COOKIE_OPTIONS);

	return new Response(JSON.stringify({}), { status: 200 });
};
