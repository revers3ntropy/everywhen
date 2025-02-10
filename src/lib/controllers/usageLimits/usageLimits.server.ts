import type { Auth } from '$lib/controllers/auth/auth';
import type { SubscriptionType } from '$lib/controllers/subscription/subscription.server';
import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { UsageLimits as _UsageLimits } from '$lib/controllers/usageLimits/usageLimits';
import { query } from '$lib/db/mysql.server';

namespace UsageLimitsServer {
    const UsageLimits = _UsageLimits;
    export type UsageLimitsBasedOnSubscription = _UsageLimits.UsageLimitsBasedOnSubscription;

    /**
     * Get the usage data for the user for all entities which are limited by usage.
     * @returns {Record<string, [number, number]>} map of entity name to [current, max]
     */
    export async function usageData(auth: Auth): Promise<Record<string, [number, number]>> {
        const currentActiveSubscription = await Subscription.getCurrentSubscription(auth);
        return {
            entries: await entryUsage(auth, currentActiveSubscription),
            labels: await labelUsage(auth, currentActiveSubscription),
            assets: await assetsUsage(auth, currentActiveSubscription),
            locations: await locationUsage(auth, currentActiveSubscription),
            events: await eventUsage(auth, currentActiveSubscription),
            dataset: await datasetUsage(auth, currentActiveSubscription),
            'rows in dataset': await datasetRowsUsage(auth, currentActiveSubscription)
        };
    }

    export async function entryUsage(auth: Auth, sub: SubscriptionType): Promise<[number, number]> {
        return [
            (
                await query<{ count: number }[]>`
                    SELECT COUNT(*) as count
                    FROM entries
                    WHERE userId = ${auth.id}
                `
            )[0].count,
            UsageLimits.usageLimits(sub).entry.maxCount
        ];
    }

    export async function labelUsage(auth: Auth, sub: SubscriptionType): Promise<[number, number]> {
        return [
            (
                await query<{ count: number }[]>`
                    SELECT COUNT(*) as count
                    FROM labels
                    WHERE userId = ${auth.id}
                `
            )[0].count,
            UsageLimits.usageLimits(sub).label.maxCount
        ];
    }

    export async function locationUsage(
        auth: Auth,
        sub: SubscriptionType
    ): Promise<[number, number]> {
        return [
            (
                await query<{ count: number }[]>`
                    SELECT COUNT(*) as count
                    FROM locations
                    WHERE userId = ${auth.id}
                `
            )[0].count,
            UsageLimits.usageLimits(sub).location.maxCount
        ];
    }

    export async function assetsUsage(
        auth: Auth,
        sub: SubscriptionType
    ): Promise<[number, number]> {
        return [
            (
                await query<{ count: number }[]>`
                    SELECT COUNT(*) as count
                    FROM assets
                    WHERE userId = ${auth.id}
                `
            )[0].count,
            UsageLimits.usageLimits(sub).asset.maxCount
        ];
    }

    export async function eventUsage(auth: Auth, sub: SubscriptionType): Promise<[number, number]> {
        return [
            (
                await query<{ count: number }[]>`
                    SELECT COUNT(*) as count
                    FROM events
                    WHERE userId = ${auth.id}
                `
            )[0].count,
            UsageLimits.usageLimits(sub).event.maxCount
        ];
    }

    export async function datasetUsage(
        auth: Auth,
        sub: SubscriptionType
    ): Promise<[number, number]> {
        return [
            (
                await query<{ count: number }[]>`
                    SELECT COUNT(*) as count
                    FROM datasets
                    WHERE userId = ${auth.id}
                `
            )[0].count,
            UsageLimits.usageLimits(sub).dataset.maxCount
        ];
    }

    export async function datasetRowsUsage(
        auth: Auth,
        sub: SubscriptionType
    ): Promise<[number, number]> {
        return [
            (
                await query<{ count: number }[]>`
                    SELECT COALESCE(MAX(rowCount), 0) as count
                    FROM datasets
                    WHERE userId = ${auth.id}
                `
            )[0].count,
            UsageLimits.usageLimits(sub).dataset.maxRowCount
        ];
    }
}

export const UsageLimits = {
    ...UsageLimitsServer,
    ..._UsageLimits
};
