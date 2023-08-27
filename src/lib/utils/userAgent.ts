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

export function userAgentFromEntry(entry: { agentData: string | null }): string {
    if (!entry.agentData) return '';

    let parsed;
    try {
        parsed = JSON.parse(entry.agentData);
    } catch (e) {
        /* empty */
    }

    if (typeof parsed !== 'object' || parsed === null) return '';
    if (!('userAgent' in parsed)) return '';
    if (typeof parsed.userAgent !== 'string') return '';
    return parsed.userAgent;
}

export interface DeviceData {
    os: string | null;
    osGroup: OsGroup;
    browser: string | null;
    browserVersion: string | null;
    device: string | null;
    deviceSpecific: string | null;
}

export function deviceDataFromEntry(entry: { agentData: string | null }): DeviceData {
    const userAgent = userAgentFromEntry(entry);
    if (!userAgent) {
        return {
            os: null,
            osGroup: 'unknown',
            browser: null,
            browserVersion: null,
            device: null,
            deviceSpecific: null
        };
    }
    const ua = new UAParser(userAgent).getResult();

    const data: DeviceData = {
        os: ua?.os?.name || null,
        osGroup: osGroupFromOS(ua?.os?.name || ''),
        browser: ua?.browser?.name || null,
        browserVersion: ua?.browser?.version?.split('.')[0] || null,
        device: ua?.device?.vendor || null,
        deviceSpecific: null
    };

    if (ua?.device?.model && ua?.device?.vendor) {
        data.deviceSpecific = `${ua.device.vendor} ${ua.device.model}`;
    }
    if (ua?.cpu?.architecture) {
        if (data.deviceSpecific) {
            // knows the device, add a little extra info
            data.deviceSpecific += ` (${ua.cpu.architecture})`;
        } else {
            // doesn't know device, only CPU architecture
            data.deviceSpecific = `${ua.cpu.architecture}`;
        }
    }

    switch (ua?.device?.type) {
        case 'mobile':
            data.osGroup = 'mobile';
            break;
        case 'tablet':
            data.osGroup = 'mobile';
            break;
        case 'smarttv':
            data.osGroup = 'tv';
            break;
        case 'console':
            data.osGroup = 'console';
            break;
        case 'wearable':
            data.osGroup = 'watch';
            break;
        case 'embedded':
            data.osGroup = 'unknown';
    }

    return data;
}

export interface AgentData {
    userAgent: string;
    language: string;
}

export function serializedAgentData(): string {
    return JSON.stringify({
        userAgent: navigator.userAgent,
        language: navigator.language
    } as AgentData);
}
