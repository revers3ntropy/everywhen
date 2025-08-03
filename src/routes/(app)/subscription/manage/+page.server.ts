import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { UsageLimits } from '$lib/controllers/usageLimits/usageLimits.server';
import { cachedPageRoute } from '$lib/utils/cache.server';

export const load = cachedPageRoute(async auth => {
    return {
        prices: await Subscription.getPriceList(),
        usageData: await UsageLimits.usageData(auth),
        sub: await Subscription.getCurrentSubscription(auth),
        hasPlusWithoutSub: await Subscription.shouldGetPlusWithoutSubscription(auth.id)
    };
});
