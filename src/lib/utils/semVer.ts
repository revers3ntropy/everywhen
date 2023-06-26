import c from 'chalk';

export class SemVer {
    constructor(public major = 0, public minor = 0, public patch = 0) {}

    static fromString(version: string): SemVer {
        const v = new SemVer();
        const parts = version.split('.');
        if (parts.length !== 3) {
            console.error(c.red('Invalid SemVer string: ' + version));
            throw new Error();
        }
        v.major = parseInt(parts[0]);
        v.minor = parseInt(parts[1]);
        v.patch = parseInt(parts[2]);
        return v;
    }

    isGreaterThan(version: SemVer | string, orEqual = false): boolean {
        if (typeof version === 'string') {
            version = SemVer.fromString(version);
        }
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

    isEqual(version: SemVer | string): boolean {
        if (typeof version === 'string') {
            version = SemVer.fromString(version);
        }
        return (
            this.major === version.major &&
            this.minor === version.minor &&
            this.patch === version.patch
        );
    }

    isLessThan(version: SemVer | string, orEqual = false): boolean {
        if (typeof version === 'string') {
            version = SemVer.fromString(version);
        }
        if (version.isEqual(this)) {
            return orEqual;
        }
        return !this.isGreaterThan(version);
    }

    str(): string {
        return `${this.major}.${this.minor}.${this.patch}`;
    }
}
