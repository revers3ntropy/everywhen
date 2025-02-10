import { SubscriptionType } from '$lib/controllers/subscription/subscription';

export namespace UsageLimits {
    export const LIMITS = {
        asset: {
            contentLenMax: (8 * 1024 * 1024) as number,
            nameLenMin: 1 as number,
            nameLenMax: 128 as number
        },
        dataset: {
            nameLenMax: 32 as number,
            nameLenMin: 1 as number
        },
        entry: {},
        event: {
            nameLenMax: 64 as number,
            nameLenMin: 1 as number
        },
        label: {
            nameLenMax: 64 as number,
            nameLenMin: 1 as number
        },
        location: {
            nameLenMax: 64 as number,
            nameLenMin: 1 as number
        },
        user: {
            passwordLenMin: 8 as number,
            passwordLenMax: 128 as number,
            usernameLenMin: 3 as number,
            usernameLenMax: 64 as number
        }
    } as const;

    export interface UsageLimitsBasedOnSubscription {
        asset: {
            maxCount: number;
        };
        dataset: {
            maxCount: number;
            maxAppendCount: number;
            maxRowCount: number;
        };
        entry: {
            maxCount: number;
        };
        event: {
            maxCount: number;
        };
        label: {
            maxCount: number;
        };
        location: {
            maxCount: number;
        };
    }

    // all limits are inclusive
    export const LIMITS_FREE = {
        asset: {
            maxCount: 5
        },
        dataset: {
            maxCount: 5,
            maxAppendCount: 100,
            maxRowCount: 1000
        },
        entry: {
            maxCount: 100
        },
        event: {
            maxCount: 10
        },
        label: {
            maxCount: 5
        },
        location: {
            maxCount: 5
        }
    } satisfies UsageLimitsBasedOnSubscription;

    export const LIMITS_PLUS = {
        asset: {
            maxCount: 500
        },
        dataset: {
            maxCount: 100,
            maxAppendCount: 10_000,
            maxRowCount: 1_000_000
        },
        entry: {
            maxCount: 100_000
        },
        event: {
            maxCount: 1000
        },
        label: {
            maxCount: 50
        },
        location: {
            maxCount: 200
        }
    } satisfies UsageLimitsBasedOnSubscription;

    export function usageLimits(sub: SubscriptionType) {
        switch (sub) {
            case SubscriptionType.Free:
                return LIMITS_FREE;
            case SubscriptionType.Plus:
                return LIMITS_PLUS;
            default:
                throw new Error(`Unknown subscription type: ${sub}`);
        }
    }
}
