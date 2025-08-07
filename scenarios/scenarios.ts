/**
 * @fileoverview Defines the data generation scenarios for an existing user.
 */

// Defines the structure for a single scenario configuration.
export interface Scenario {
    description: string;
    entriesPerUser: number;
    editsPerEntry: number;
    labelsPerUser: number;
    assetsPerUser: number;
}

// A record of available scenarios, mapping a key to a Scenario object.
export const scenarios: Record<string, Scenario> = {
    basic_data: {
        description: 'Generate a small amount of data for the specified user.',
        entriesPerUser: 5,
        editsPerEntry: 1,
        labelsPerUser: 3,
        assetsPerUser: 2
    },
    power_user_data: {
        description: 'Generate a large amount of data for the specified user.',
        entriesPerUser: 100,
        editsPerEntry: 5,
        labelsPerUser: 20,
        assetsPerUser: 50
    },
    fresh_start: {
        description: 'Generate only labels and assets, no journal entries.',
        entriesPerUser: 0,
        editsPerEntry: 0,
        labelsPerUser: 5,
        assetsPerUser: 5
    }
};
