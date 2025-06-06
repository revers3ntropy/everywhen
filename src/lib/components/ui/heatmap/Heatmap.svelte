<script lang="ts">
    import { getWeekIndex, stringifyDate } from '$lib/components/ui/heatmap/date';
    import { chunkMonths, chunkWeeks, getCalendar } from './heatmap';

    export let data: { date: Date; value: number }[];
    export let startDate: Date;
    export let endDate: Date;
    export let allowOverflow = false;
    export let cellGap = 2;
    export let cellRadius = 0;
    export let cellSize = 10;
    export let colors = ['#c6e48b', '#7bc96f', '#239a3b', '#196127'];
    export let dayLabelWidth = 20;
    export let dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
    export let emptyColor = '#ebedf0';
    export let fontColor = '#333';
    export let fontFamily = 'sans-serif';
    export let fontSize = 8;
    export let monthGap = 2;
    export let monthLabelHeight = 12;
    export let monthLabels = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
    ];
    export let view = 'weekly';

    const isNewMonth = (
        chunks: { date: Date; value: number; color: string }[][],
        index: number
    ) => {
        const chunk = chunks[index];
        const prev = chunks[index - 1];

        if (!prev) {
            return true;
        }

        if (!prev.length || !chunk.length) {
            return false;
        }

        const currentIndex = chunk[0].date.getMonth();
        const prevIndex = prev[0].date.getMonth();

        return (
            index < chunks.length &&
            index < chunks.length - 1 &&
            (currentIndex > prevIndex || (currentIndex === 0 && prevIndex === 11))
        );
    };

    $: cellRect = cellSize + cellGap;

    $: calendar = getCalendar(colors, data, emptyColor, endDate, startDate, view);

    $: chunks =
        view === 'monthly'
            ? chunkMonths(allowOverflow, calendar, endDate, startDate)
            : chunkWeeks(allowOverflow, calendar, endDate, startDate);

    $: weekRect = 7 * cellRect - cellGap;

    $: height =
        view === 'monthly'
            ? 6 * cellRect - cellGap + monthLabelHeight // <- max of 6 rows in monthly view
            : weekRect + monthLabelHeight;

    $: width =
        view === 'monthly'
            ? (weekRect + monthGap) * chunks.length - monthGap
            : cellRect * chunks.length - cellGap + dayLabelWidth;

    function dayLabelPosition(index: number) {
        return cellRect * index + cellRect / 2 + monthLabelHeight;
    }
</script>

<svg viewBox={`0 0 ${width} ${height}`}>
    {#if view === 'monthly'}
        {#each chunks as chunk, index}
            <g transform={`translate(${(7 * cellRect - cellGap + monthGap) * index}, 0)`}>
                {#each chunk as day}
                    <rect
                        data-date={stringifyDate(day.date)}
                        data-value={day.value}
                        fill={day.color}
                        height={cellSize}
                        rx={cellRadius}
                        width={cellSize}
                        x={day.date.getDay() * cellRect}
                        y={getWeekIndex(day.date) * cellRect + monthLabelHeight}
                    />
                {/each}
                {#if monthLabelHeight > 0}
                    <text
                        alignment-baseline="hanging"
                        fill={fontColor}
                        font-family={fontFamily}
                        font-size={fontSize}
                        x="0"
                        y="0"
                    >
                        {monthLabels[chunk[0].date.getMonth()]}
                    </text>
                {/if}
            </g>
        {/each}
    {:else}
        {#if dayLabelWidth > 0}
            {#each dayLabels as label, index}
                <text
                    alignment-baseline="middle"
                    fill={fontColor}
                    font-family={fontFamily}
                    font-size={fontSize}
                    x="0"
                    y={dayLabelPosition(index)}
                >
                    {label}
                </text>
            {/each}
        {/if}
        <g transform={`translate(${dayLabelWidth})`}>
            {#each chunks as chunk, index}
                <g transform={`translate(${cellRect * index}, ${monthLabelHeight})`}>
                    {#each chunk as day}
                        <rect
                            data-date={stringifyDate(day.date)}
                            data-value={day.value}
                            fill={day.color}
                            height={cellSize}
                            rx={cellRadius}
                            width={cellSize}
                            y={day.date.getDay() * cellRect}
                            x={0}
                        />
                    {/each}
                </g>
                {#if monthLabelHeight > 0 && isNewMonth(chunks, index) && chunk.length}
                    <text
                        alignment-baseline="hanging"
                        fill={fontColor}
                        font-family={fontFamily}
                        font-size={fontSize}
                        x={cellRect * index}
                    >
                        {monthLabels[chunk[0].date.getMonth()]}
                    </text>
                {/if}
            {/each}
        </g>
    {/if}
</svg>
