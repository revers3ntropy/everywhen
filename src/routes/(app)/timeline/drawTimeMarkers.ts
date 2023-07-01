import type { RenderProps } from '$lib/components/canvas/canvasState';
import { NAVBAR_HEIGHT } from '$lib/constants';
import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
import { monthIdxToName } from './utils';

export function drawYears(state: RenderProps, startYear: number, showYears: number) {
    let year = Math.max(new Date(state.xToTime(0) * 1000).getFullYear() || 0, startYear);

    const showYearText = state.zoom >= 2e-6;
    const showBothSidesText = state.zoom >= 1e-5;

    while (true) {
        const renderPos = state.dateToRenderPos(year, 0, 1);

        if (renderPos > state.width) break;
        if (year - startYear > showYears) break;

        // -1 to center, as has width 3
        state.rect(renderPos - 1, 0, 3, state.height, {
            radius: 0,
            color: state.colors.text
        });

        if (showYearText) {
            state.text(year.toString(), renderPos + 5, NAVBAR_HEIGHT + 10);
        }
        if (showBothSidesText) {
            state.text((year - 1).toString(), renderPos - 25, NAVBAR_HEIGHT + 10);
        }

        year++;
    }
}

export function drawMonths(state: RenderProps, startYear: number) {
    if (state.zoom < 1e-5) return;

    let year = Math.max(new Date(state.xToTime(0) * 1000).getFullYear() || 0, startYear);

    let month = 0;

    const showMonthText = state.zoom >= 1e-5;
    const showYear = state.zoom >= 1e-4;

    while (true) {
        const renderPos = state.dateToRenderPos(year, month, 1);

        if (renderPos > state.width) break;

        state.rect(renderPos, 0, 1, state.height, {
            color: state.colors.text
        });

        if (showMonthText) {
            let text = monthIdxToName(month);
            if (showYear) text += ` ${year}`;
            state.text(text, renderPos + 6, NAVBAR_HEIGHT + 20);
        }

        month++;
        if (month > 11) {
            month = 0;
            year++;
        }
    }
}

export function drawDays(state: RenderProps, startYear: number) {
    if (state.zoom < 5e-5) return;

    let leftMost = state.xToTime(0);
    const thisWeek = fmtUtc(nowUtc(), currentTzOffset(), 'YYYY-WW');
    const lastWeek = fmtUtc(nowUtc() - 604800, currentTzOffset(), 'YYYY-WW');
    const nextWeek = fmtUtc(nowUtc() + 604800, currentTzOffset(), 'YYYY-WW');

    const firstDayTimestamp = new Date(startYear, 0, 1).getTime() / 1000;
    if (leftMost < firstDayTimestamp) {
        leftMost = firstDayTimestamp;
    }

    let day = Math.floor(leftMost / 86400) * 86400;
    // deal with timezones
    day -= currentTzOffset() * 60 * 60;
    // put at midday for daylight saving's issues
    day += 12 * 60 * 60;

    const showDayText = state.zoom >= 1.2e-3;
    const showDays = state.zoom >= 5e-4;
    const showWeekText = state.zoom >= 1.2e-4;
    const showWeeks = state.zoom >= 1.2e-4;

    while (true) {
        const dayDate = new Date(day * 1000);
        const dayStart =
            new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate()).getTime() / 1000;
        const renderPos = state.timeToX(dayStart);

        if (renderPos > state.width) break;

        const isMonday = fmtUtc(dayStart, currentTzOffset(), 'ddd') === 'Mon';

        const shouldShow = (isMonday && showWeeks) || showDays;

        if (shouldShow) {
            state.rect(renderPos, 0, 1, state.height, {
                color: isMonday ? state.colors.primary : state.colors.lightAccent
            });
        }

        if (showDayText && shouldShow) {
            let text = fmtUtc(dayStart, currentTzOffset(), 'ddd Do');

            if (
                fmtUtc(dayStart, currentTzOffset(), 'YYY-MM-DD') ===
                fmtUtc(nowUtc(), currentTzOffset(), 'YYY-MM-DD')
            ) {
                text += ' (Today)';
            } else if (
                fmtUtc(dayStart, currentTzOffset(), 'YYY-MM-DD') ===
                fmtUtc(nowUtc() - 86400, currentTzOffset(), 'YYY-MM-DD')
            ) {
                text += ' (Yesterday)';
            } else if (
                fmtUtc(dayStart, currentTzOffset(), 'YYY-MM-DD') ===
                fmtUtc(nowUtc() + 86400, currentTzOffset(), 'YYY-MM-DD')
            ) {
                text += ' (Tomorrow)';
            }

            state.text(text, renderPos + 6, NAVBAR_HEIGHT + 40);
        }

        const week = fmtUtc(dayStart, currentTzOffset(), 'YYYY-WW');

        if (showWeekText && isMonday) {
            let text;
            if (week === thisWeek) {
                text = 'This week';
            } else if (week === lastWeek) {
                text = 'Last week';
            } else if (week === nextWeek) {
                text = 'Next week';
            } else {
                const [thisYear, thisWeekIdx] = thisWeek.split('-').map(parseInt);
                const [weekYear, weekIdx] = week.split('-').map(parseInt);

                if (thisYear === weekYear && thisWeekIdx > weekIdx) {
                    text = `${thisWeekIdx - weekIdx} weeks ago`;
                }
            }

            if (text) {
                state.text(text, renderPos + 6, NAVBAR_HEIGHT + 30);
            }
        }

        day += 86400;
    }
}

export function drawHours(state: RenderProps, startYear: number) {
    if (state.zoom < 5e-3) return;

    let leftMost = state.xToTime(0);

    const firstHourTimestamp = new Date(startYear, 0, 1).getTime() / 1000;
    if (leftMost < firstHourTimestamp) {
        leftMost = firstHourTimestamp;
    }

    let hour = Math.floor(leftMost / (60 * 60)) * (60 * 60);
    // deal with timezones
    hour -= currentTzOffset() * 60 * 60;

    const showHourText = state.zoom >= 1.2e-2;

    while (true) {
        const renderPos = state.timeToX(hour);

        if (renderPos > state.width) break;

        state.rect(renderPos, 0, 1, state.height, {
            color: state.colors.vLightAccent
        });

        if (showHourText) {
            state.text(fmtUtc(hour, currentTzOffset(), 'ha'), renderPos + 6, NAVBAR_HEIGHT + 50);
        }

        hour += 60 * 60;
    }
}
