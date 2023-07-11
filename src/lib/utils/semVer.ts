import { Result } from '$lib/utils/result';

export class SemVer {
    constructor(
        public major = 0,
        public minor = 0,
        public patch = 0
    ) {}

    static fromString(version: string): Result<SemVer> {
        const v = new SemVer();
        const parts = version.split('.');
        if (parts.length !== 3) {
            return Result.err('Invalid SemVer string: ' + version);
        }
        v.major = parseInt(parts[0]);
        v.minor = parseInt(parts[1]);
        v.patch = parseInt(parts[2]);
        return Result.ok(v);
    }

    isGreaterThan(version: SemVer, orEqual = false): boolean {
        if (orEqual && this.isEqual(version)) {
            return true;
        }
        if (this.major > version.major) {
            return true;
        }
        if (this.major === version.major) {
            if (this.minor > version.minor) {
                return true;
            }
            if (this.minor === version.minor) {
                return this.patch > version.patch;
            }
        }
        return false;
    }

    isEqual(version: SemVer): boolean {
        return (
            this.major === version.major &&
            this.minor === version.minor &&
            this.patch === version.patch
        );
    }

    isLessThan(version: SemVer, orEqual = false): boolean {
        if (version.isEqual(this)) {
            return orEqual;
        }
        return !this.isGreaterThan(version);
    }

    str(): string {
        return `${this.major}.${this.minor}.${this.patch}`;
    }
}
