<script lang="ts">
    import { renderable, type RenderProps } from '../../lib/canvas/canvasHelpers';
    import { monthIdxToName } from "./utils";
    import { NAVBAR_HEIGHT } from "../../lib/constants";
    import { browser } from "$app/environment";
    import { currentTzOffset, fmtUtc, nowS } from '../../lib/utils/time.js';

    export let startYear: number;

    const showYears = 200;

    const colours = {
        year: 'rgba(255, 255, 255, 0.5)',
        month: '#fff',
        week: '#aaa',
        day: '#666',
        hour: '#444',
    }

    $: if (startYear + showYears < new Date().getFullYear()) {
        if (browser) alert(`Born in ${startYear}?? You are old!`);
        startYear = new Date().getFullYear() - showYears;
    }

    $: if (startYear > new Date().getFullYear()) {
        if (browser) alert(`Born in ${startYear}?? You are young!`);
        startYear = new Date().getFullYear();
    }

    function drawYears (state: RenderProps) {
        let year = Math.max(
            new Date(state.renderPosToTime(0) * 1000).getFullYear() || 0,
            startYear,
        );

        let showYearText = state.zoom >= 2e-6;
        let showBothSidesText = state.zoom >= 1e-5;

        while (true) {
            let renderPos = state.dateToRenderPos(year, 0, 1);

            if (renderPos > state.width) break;
            if (year - startYear > showYears) break;

            // -1 to center, as has width 3
            state.rect(renderPos - 1, 0, 3, state.height, {
                radius: 0,
                colour: colours.year,
            });

            if (showYearText) {
                state.text(year.toString(), renderPos + 5, NAVBAR_HEIGHT + 10);
            }
            if (showBothSidesText) {
                state.text((year-1).toString(), renderPos - 25, NAVBAR_HEIGHT + 10);
            }

            year++;
        }
    }

    function drawMonths (state: RenderProps) {
        if (state.zoom < 1e-5) return;

        let year = Math.max(
            new Date(state.renderPosToTime(0) * 1000).getFullYear() || 0,
            startYear,
        );

        let month = 0;

        let showMonthText = state.zoom >= 1e-5;
        let showYear = state.zoom >= 1e-4;

        while (true) {
            let renderPos = state.dateToRenderPos(year, month, 1);

            if (renderPos > state.width) break;

            state.rect(renderPos, 0, 1, state.height, {
                colour: colours.month,
            });

            if (showMonthText) {
                let text = monthIdxToName(month);
                if (showYear) text += ' ' + year;
                state.text(text, renderPos + 6, NAVBAR_HEIGHT + 20);
            }

            month++;
            if (month > 11) {
                month = 0;
                year++;
            }
        }
    }

    function drawDays (state: RenderProps) {
        if (state.zoom < 5e-5) return;

        let leftMost = state.renderPosToTime(0);
        const thisWeek = fmtUtc(nowS(), currentTzOffset(), 'YYYY-WW');
        const lastWeek = fmtUtc(nowS() - 604800, currentTzOffset(), 'YYYY-WW');
        const nextWeek = fmtUtc(nowS() + 604800, currentTzOffset(), 'YYYY-WW');

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

        while (true) {
            const dayDate = new Date(day * 1000)
            let dayStart = new Date(
                dayDate.getFullYear(),
                dayDate.getMonth(),
                dayDate.getDate()
            ).getTime() / 1000;
            let renderPos = state.timeToRenderPos(dayStart);

            if (renderPos > state.width) break;

            const isMonday = fmtUtc(dayStart, currentTzOffset(), 'ddd') === 'Mon';

            const shouldShow = isMonday || showDays;

            if (shouldShow) {
                state.rect(renderPos, 0, 1, state.height, {
                    colour: isMonday ? colours.week : colours.day,
                });
            }

            if (showDayText && shouldShow) {
                let text = fmtUtc(dayStart, currentTzOffset(), 'ddd Do');

                if (
                    fmtUtc(dayStart, currentTzOffset(), 'YYY-MM-DD') ===
                    fmtUtc(nowS(), currentTzOffset(), 'YYY-MM-DD')
                ) {
                    text += ' (Today)';
                } else if (
                    fmtUtc(dayStart, currentTzOffset(), 'YYY-MM-DD') ===
                    fmtUtc(nowS() - 86400, currentTzOffset(), 'YYY-MM-DD')
                ) {
                    text += ' (Yesterday)';
                } else if (
                    fmtUtc(dayStart, currentTzOffset(), 'YYY-MM-DD') ===
                    fmtUtc(nowS() + 86400, currentTzOffset(), 'YYY-MM-DD')
                ) {
                    text += ' (Tomorrow)';
                }

                state.text(
                    text,
                    renderPos + 6,
                    NAVBAR_HEIGHT + 40
                );
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
                    const [ thisYear, thisWeekIdx ] = thisWeek.split('-');
                    const [ weekYear, weekIdx ] = week.split('-');

                    if (thisYear === weekYear && thisWeekIdx > weekIdx) {
                        text = `${thisWeekIdx - weekIdx} weeks ago`;
                    }
                }

                if (text) {
                    state.text(
                        text,
                        renderPos + 6,
                        NAVBAR_HEIGHT + 30
                    );
                }
            }

            day += 86400;
        }
    }

    function drawHours (state: RenderProps) {
        if (state.zoom < 5e-3) return;

        let leftMost = state.renderPosToTime(0);

        const firstHourTimestamp = new Date(startYear, 0, 1).getTime() / 1000;
        if (leftMost < firstHourTimestamp) {
            leftMost = firstHourTimestamp;
        }

        let hour = Math.floor(leftMost / (60*60)) * (60*60);
        // deal with timezones
        hour -= currentTzOffset() * 60 * 60;

        const showHourText = state.zoom >= 1.2e-2;

        while (true) {
            let renderPos = state.timeToRenderPos(hour);

            if (renderPos > state.width) break;

            state.rect(renderPos, 0, 1, state.height, {
                colour: colours.hour,
            });

            if (showHourText) {
                state.text(
                    fmtUtc(hour, currentTzOffset(), 'ha'),
                    renderPos + 6,
                    NAVBAR_HEIGHT + 50
                );
            }

            hour += 60*60;
        }
    }

    renderable(state => {
        drawHours(state);
        drawDays(state);
        drawMonths(state);
        drawYears(state);
    });
</script>

<slot></slot>