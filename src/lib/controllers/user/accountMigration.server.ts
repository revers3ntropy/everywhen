import type { User } from '$lib/controllers/user/user.server';
import { query } from '$lib/db/mysql.server';
import { decrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { currentVersion, SemVer } from '$lib/utils/semVer';
import { wordCount } from '$lib/utils/text';

export async function migrateUser(user: User): Promise<Result<User>> {
    if (currentVersion.isEqual(user.versionLastLoggedIn)) {
        return Result.ok(user);
    }

    // do migrations in chronological order
    const migratorKeys = Object.keys(migrators);
    const migratorVersions = migratorKeys
        .map(key => SemVer.fromString(key).unwrap())
        .sort((a, b) => a.compare(b));

    for (const version of migratorVersions) {
        if (!user.versionLastLoggedIn.isLessThan(version)) continue;
        const migrateRes = await migrators[version.str()](user);
        if (!migrateRes.ok) return migrateRes.cast();
        user = migrateRes.val;
    }

    await query`
        UPDATE users
        SET versionLastLoggedIn = ${currentVersion.str()}
        WHERE id = ${user.id}
    `;

    return Result.ok({ ...user, versionLastLoggedIn: currentVersion });
}

const migrators: Record<string, (user: User) => Promise<Result<User>>> = {
    async '0.5.88'(user: User): Promise<Result<User>> {
        const entries = await query<{ id: string; entry: string }[]>`
            SELECT id, body FROM entries WHERE userId = ${user.id}
        `;

        for (const { id, entry } of entries) {
            const decryptedEntry = decrypt(entry, user.key);
            if (!decryptedEntry.ok) return decryptedEntry.cast();
            const entryWordCount = wordCount(decryptedEntry.val);
            await query`
                UPDATE entries
                SET wordCount = ${entryWordCount}
                WHERE id = ${id}
            `;
        }

        return Result.ok({ ...user, versionLastLoggedIn: SemVer.fromString('0.5.88').unwrap() });
    }
};
