<script lang="ts">
    import { renderable, type RenderProps } from '../../lib/canvas/canvas';

    export let startYear: number;

    function drawYears (state: RenderProps) {
        let year = Math.max(
            new Date(state.renderPosToTime(0) * 1000).getFullYear(),
            startYear,
        );

        while (true) {
            let renderPos = state.timeToRenderPos(new Date(year, 0, 0).getUTCDate() / 1000);
            if (renderPos > state.width) break;
            if (year - startYear > 200) break;

            state.rect(renderPos, 0, 3, state.height, {
                radius: 0,
                colour: '#EEE',
            });

            year++;
        }
    }

    renderable(state => {
        drawYears(state);
    });
</script>

<slot></slot>