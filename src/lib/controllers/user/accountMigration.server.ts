import { Entry } from '$lib/controllers/entry/entry.server';
import type { User } from '$lib/controllers/user/user.server';
import { query } from '$lib/db/mysql.server';
import { decrypt, encrypt } from '$lib/utils/encryption';
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
        user = {
            ...migrateRes.val,
            versionLastLoggedIn: version
        };
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
        const entries = await query<{ id: string; body: string }[]>`
            SELECT id, body FROM entries WHERE userId = ${user.id}
        `;

        for (const { id, body } of entries) {
            const decryptedEntry = decrypt(body, user.key);
            if (!decryptedEntry.ok) return decryptedEntry.cast();
            const entryWordCount = wordCount(decryptedEntry.val);
            await query`
                UPDATE entries
                SET wordCount = ${entryWordCount}
                WHERE id = ${id}
            `;
        }

        return Result.ok(user);
    },

    async '0.6.8'(user: User): Promise<Result<User>> {
        const entries = await query<
            { id: string; body: string; title: string; deleted: number | null }[]
        >`
            SELECT id, body, title, deleted
            FROM entries
            WHERE userId = ${user.id}
        `;

        for (const { id, body, deleted, title } of entries) {
            const decryptedEntry = decrypt(body, user.key);
            if (!decryptedEntry.ok) return decryptedEntry.cast();
            const decryptedTitle = decrypt(title, user.key);
            if (!decryptedTitle.ok) return decryptedTitle.cast();

            await Entry.updateWordIndex(
                user,
                decryptedEntry.val,
                decryptedTitle.val,
                id,
                Entry.isDeleted({ deleted }),
                true
            );
        }

        return Result.ok(user);
    },

    async '0.6.27'(user: User): Promise<Result<User>> {
        const datasetRows = await query<{ id: string; rowJson: string }[]>`
            SELECT id, rowJson
            FROM datasetRows
            WHERE userId = ${user.id}
        `;

        for (const { id, rowJson } of datasetRows) {
            await query`
                UPDATE datasetRows
                SET rowJson = ${encrypt(rowJson, user.key)}
                WHERE id = ${id}
            `;
        }

        return Result.ok(user);
    }
};
