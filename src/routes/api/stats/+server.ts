import { Stats } from '$lib/controllers/stats/stats.server';
import { api404Handler } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import { Day } from '$lib/utils/day';
import { Result } from '$lib/utils/result';
import { error, type RequestHandler } from '@sveltejs/kit';

export const GET = cachedApiRoute(async (auth, { url }) => {
    const groupingStr = url.searchParams.get('grouping');
    if (!groupingStr) error(400, 'Grouping is required');
    const grouping = Stats.groupingFromString(groupingStr);
    if (!grouping) error(400, 'Grouping is invalid');

    let fromStr = url.searchParams.get('from');
    if (!fromStr) fromStr = Day.today(0).plusMonths(-12).fmtIso();
    let from = Day.fromString(fromStr);
    if (!from.ok) {
        from = Result.wrap(() => Day.fromTimestamp(parseInt(fromStr), 0)).mapErr(
            () => 'from is invalid'
        );
    }
    if (!from.ok) error(400, 'from is invalid');

    let toStr = url.searchParams.get('to');
    if (!toStr) toStr = Day.today(0).fmtIso();
    let to = Day.fromString(toStr);
    if (!to.ok) {
        to = Result.wrap(() => Day.fromTimestamp(parseInt(toStr), 0)).mapErr(() => 'to is invalid');
    }
    if (!to.ok) error(400, 'from is invalid');

    return (
        await Stats.getEntryStats(
            auth,
            grouping,
            from.val.utcTimestampStartOfDay(0),
            to.val.utcTimestampEndOfDay(0)
        )
    ).unwrap(e => error(400, e));
}) satisfies RequestHandler;

export const POST = api404Handler;
export const DELETE = api404Handler;
export const PUT = api404Handler;
