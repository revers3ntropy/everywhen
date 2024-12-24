<script lang="ts">
    import { stringifyDate } from '../utils/date';

    export let color: string;
    export let date: Date;
    export let radius: number;
    export let size: number;
    export let value: number;
    export let x: number;
    export let y: number;
</script>

<rect
    data-date={stringifyDate(date)}
    data-value={value}
    fill={color}
    height={size}
    rx={radius}
    width={size}
    {x}
    {y}
/>
