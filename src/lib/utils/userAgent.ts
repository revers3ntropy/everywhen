import UAParser from 'ua-parser-js';

export const mobileOSs = [
    'Android',
    'Android-x86',
    'BlackBerry',
    'iOS',
    'Windows Phone',
    'Windows Mobile',
    'Palm'
];
export const watchOSs = ['watchOS'];
export const tvOSs = ['tvOS', 'NetTV'];
export const consoleOSs = ['PlayStation', 'Xbox'];
export const macOSs = ['Mac OS'];
export const windowsOSs = ['Windows'];
export const osGroups = [
    'mobile',
    'mac',
    'windows',
    'linux',
    'console',
    'tv',
    'watch',
    'unknown'
] as const;

export type OsGroup = (typeof osGroups)[number];

const osGroupsMap: Record<OsGroup, string[]> = {
    mobile: mobileOSs,
    watch: watchOSs,
    tv: tvOSs,
    console: consoleOSs,
    mac: macOSs,
    windows: windowsOSs,
    linux: [],
    unknown: []
};

function osGroupFromOS(os: string): OsGroup {
    for (const osGroup in osGroupsMap) {
        if (osGroupsMap[osGroup as OsGroup].includes(os)) {
            return osGroup as OsGroup;
        }
    }
    // call everything else linux
    if (os) return 'linux';
    return 'unknown';
}

export function osFromUserAgentString(userAgentString: string): string | undefined {
    if (!userAgentString) return undefined;
    const ua = new UAParser(userAgentString).getResult();
    return ua?.os?.name;
}

export function osGroupFromUserAgentString(userAgentString: string): OsGroup {
    return osGroupFromOS(osFromUserAgentString(userAgentString) || '');
}

export function userAgentFromEntry(entry: { agentData?: string }): string {
    const agentData = entry.agentData;
    if (!agentData) return '';

    let parsed;
    try {
        parsed = JSON.parse(agentData);
    } catch (e) {
        /* empty */
    }

    if (typeof parsed !== 'object' || parsed === null) return '';
    if (!('userAgent' in parsed)) return '';
    if (typeof parsed.userAgent !== 'string') return '';
    return parsed.userAgent;
}

export function osGroupFromEntry(entry: { agentData?: string }): OsGroup {
    return osGroupFromUserAgentString(userAgentFromEntry(entry));
}

export interface AgentData {
    userAgent: string;
    language: string;
    appVersion: string;
    platform: string;
}

export function serializedAgentData(): string {
    return JSON.stringify({
        userAgent: navigator.userAgent,
        language: navigator.language,
        appVersion: navigator.appVersion,
        platform: navigator.platform
    } as AgentData);
}
