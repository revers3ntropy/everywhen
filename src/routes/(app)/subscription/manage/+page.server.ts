import type { Pricing } from '$lib/controllers/subscription/subscription';
import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { cachedPageRoute } from '$lib/utils/cache.server';

let priceCache: Pricing[] | null = null;

export const load = cachedPageRoute(async () => {
    if (priceCache) return { prices: priceCache };
    const prices = await Subscription.getPriceList();
    priceCache = prices;
    return { prices };
});
