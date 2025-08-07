import { UsageLimits } from '../src/lib/controllers/usageLimits/usageLimits';

export interface CustomEntry {
    body: string;
    title?: string;
    label?: boolean;
}

export interface Scenario {
    description: string;
    entryCount: number;
    editsPerEntry: number;
    labelCount: number;
    assetCount: number;
    entries?: CustomEntry[];
}

export const scenarios: Record<string, Scenario> = {
    empty: {
        description: 'No data',
        entryCount: 0,
        editsPerEntry: 0,
        labelCount: 0,
        assetCount: 0
    },
    small: {
        description: 'A small amount of data',
        entryCount: 5,
        editsPerEntry: 1,
        labelCount: 3,
        assetCount: 2
    },
    max_everything: {
        description: 'TO THE MAX: up to Plus limits on everything - may take a while to run',
        entryCount: UsageLimits.LIMITS_PLUS.entry.maxCount,
        editsPerEntry: 5,
        labelCount: UsageLimits.LIMITS_PLUS.label.maxCount,
        assetCount: UsageLimits.LIMITS_PLUS.asset.maxCount
    },
    realistic: {
        description: 'A realistic, somewhat new user account',
        entryCount: 432,
        editsPerEntry: 0,
        labelCount: 10,
        assetCount: 48,
        entries: [
            {
                title: 'Yellow Socks guy',
                label: false,
                body:
                    'There’s a man on my train who wears bright yellow socks every Thursday.\n' +
                    "I don’t know why it’s only Thursdays. Maybe it's laundry day.\n" +
                    "Maybe it's a silent protest against the tyranny of beige.\n" +
                    'Either way, I respect him deeply.'
            },
            {
                body:
                    'My neighbour on the left always waters his plants at exactly 6:03 a.m., muttering what sounds like Latin.\n' +
                    'He also owns 7 identical robes (or extremely flowy cardigans).\n' +
                    'Last week, I saw him staring at a pigeon for five minutes until it flew away.\n' +
                    'Still, if my toaster starts talking to me, I’m moving.'
            },
            {
                body:
                    'Saw a kid wearing crocs, a cape, and sunglasses inside the library.\n' +
                    'Honestly? He gets it.',
                label: true
            },
            {
                title: 'Toddler named spike?',
                body:
                    'I heard someone yell “Sebastian, NO!” and thought it was a child.\n' +
                    'It was a schnauzer.\n' +
                    'Then I started thinking about how I’ve never met a toddler named Spike.\n' +
                    'We need a name swap summit.'
            }
        ]
    }
};
