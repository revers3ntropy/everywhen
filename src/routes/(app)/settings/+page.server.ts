import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { cachedPageRoute } from '$lib/utils/cache.server';

export const load = cachedPageRoute(async () => {
    return { prices: await Subscription.getPriceList() };
});
