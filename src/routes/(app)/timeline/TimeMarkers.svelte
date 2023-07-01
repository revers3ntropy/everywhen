<script lang="ts">
    import { browser } from '$app/environment';
    import { renderable } from '$lib/components/canvas/renderable';
    import { drawDays, drawHours, drawMonths, drawYears } from './drawTimeMarkers';

    export let startYear = 2000;

    const showYears = 100;
    const currentYear = new Date().getFullYear();

    $: if (startYear + showYears < currentYear) {
        if (browser) alert(`Born in ${startYear}?? You are old!`);
        startYear = currentYear - showYears;
    }

    $: if (startYear > currentYear) {
        if (browser) alert(`Born in ${startYear}?? You are young!`);
        startYear = currentYear;
    }

    renderable(state => {
        drawHours(state, startYear);
        drawDays(state, startYear);
        drawMonths(state, startYear);
        drawYears(state, startYear, showYears);
    });
</script>

<slot />
