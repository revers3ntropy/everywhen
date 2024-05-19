import type { SettingConfig, SettingValue } from '$lib/controllers/settings/settings';
import type { OptionalCoords, Seconds } from '../../../types';

export const settingsConfig = {
    homeLocation: {
        type: 'location',
        defaultValue: [null, null] as OptionalCoords,
        name: 'Home Location',
        description: 'Your home location. Used by Weather.',
        showInSettings: true
    } as SettingConfig<OptionalCoords>,
    hideEntriesByDefault: {
        type: 'boolean',
        defaultValue: false,
        name: 'Blur Entries By Default',
        description: 'Blur entries by default, and manually show them.',
        showInSettings: true
    } as SettingConfig<boolean>,
    showAgentWidgetOnEntries: {
        type: 'boolean',
        defaultValue: false,
        name: 'Show Device',
        description: 'Shows the operating system of the device the entry was submitted on.',
        showInSettings: true
    } as SettingConfig<boolean>,
    autoHideEntriesDelay: {
        type: 'number',
        defaultValue: 0,
        name: 'Auto Blur Entries After',
        description: `Blur entries after 'N' seconds without user interaction. Set to 0 to disable.`,
        showInSettings: true,
        unit: 'seconds'
    } as SettingConfig<Seconds>,
    passcode: {
        type: 'string',
        defaultValue: '',
        name: 'Passcode',
        description: `Passcode to access the app. Leave blank to disable.`,
        showInSettings: true
    } as SettingConfig<string>,
    passcodeTimeout: {
        type: 'number',
        defaultValue: 0,
        name: 'Passcode Timeout',
        description:
            `Delay before passcode is required again. ` +
            `Set to 0 to only require once per device.`,
        showInSettings: true,
        unit: 'seconds'
    } as SettingConfig<Seconds>,
    yearOfBirth: {
        type: 'number',
        defaultValue: 2000,
        name: 'Year of Birth',
        description: `The first year in which you lived. Used by the timeline.`,
        showInSettings: true
    } as SettingConfig<number>,
    showNYearsAgoEntryTitles: {
        type: 'boolean',
        defaultValue: true,
        name: 'Show "On this Day" Entries',
        description: `Show entries which happened on this day some number of years ago in your journal.`,
        showInSettings: true
    } as SettingConfig<boolean>,
    preferLocationOn: {
        type: 'boolean',
        defaultValue: false,
        name: 'Prefer Location',
        description: `Prefer location to be on by default.`,
        showInSettings: true
    } as SettingConfig<boolean>,
    showArrowsBetweenEntriesOnMap: {
        type: 'boolean',
        defaultValue: false,
        name: 'Arrows Between Entries',
        description: `Show arrows between chronologically adjacent entries on the map.`,
        showInSettings: true
    } as SettingConfig<boolean>,
    gitHubAccessToken: {
        type: 'string',
        defaultValue: '',
        name: 'GitHub Access Token',
        description: `Access token for GitHub API. Used to fetch your GitHub activity.`,
        showInSettings: false
    } as SettingConfig<string>,
    happinessInputStyle: {
        type: ['likert', 'scale'],
        defaultValue: 'likert',
        name: 'Happiness Input Style',
        description: `How you want to enter a value for Happiness.`,
        showInSettings: true
    } as SettingConfig<string>
} satisfies Record<string, SettingConfig<SettingValue>>;
