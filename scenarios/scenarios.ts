import { UsageLimits } from '../src/lib/controllers/usageLimits/usageLimits';

export interface Scenario {
    description: string;
    entryCount: number;
    editsPerEntry: number;
    labelCount: number;
    assetCount: number;
}

export const scenarios: Record<string, Scenario> = {
    small: {
        description: 'A small amount of data',
        entryCount: 5,
        editsPerEntry: 1,
        labelCount: 3,
        assetCount: 2
    },
    realistic: {
        description: 'A realistic, somewhat new user account',
        entryCount: 400,
        editsPerEntry: 0,
        labelCount: 10,
        assetCount: 50
    },
    max_everything: {
        description: 'TO THE MAX: up to Plus limits on everything - may take a while to run',
        entryCount: UsageLimits.LIMITS_PLUS.entry.maxCount,
        editsPerEntry: 5,
        labelCount: UsageLimits.LIMITS_PLUS.label.maxCount,
        assetCount: UsageLimits.LIMITS_PLUS.asset.maxCount
    }
};
