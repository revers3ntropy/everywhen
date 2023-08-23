import type { SemVer } from '$lib/utils/semVer';

export interface User {
    id: string;
    username: string;
    key: string;
    versionLastLoggedIn: SemVer;
}

export namespace User {}
