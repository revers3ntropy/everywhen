import type { User } from '$lib/controllers/user/user.server';
import { query } from '$lib/db/mysql.server';
import { currentVersion } from '$lib/utils/semVer';

export async function migrateUser(user: User): Promise<User> {
    if (currentVersion.isEqual(user.versionLastLoggedIn)) {
        return { ...user };
    }

    // MUST do migrations in chronological order

    await query`
        UPDATE users
        SET versionLastLoggedIn = ${currentVersion.str()}
        WHERE id = ${user.id}
    `;

    return { ...user, versionLastLoggedIn: currentVersion };
}
