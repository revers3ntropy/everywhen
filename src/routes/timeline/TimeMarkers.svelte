<script lang="ts">
    import { renderable, START_ZOOM } from "../../lib/canvas/canvas";

    renderable(state => {
        let date = new Date(2005, 0, 1);

        let years = 0;
        // Years
        while (true) {
            let renderPos = state.timeToRenderPos(date.getTime() / 1000);
            if (renderPos > state.width) {
                break;
            }
            years++;
            if (years > 100) {
                break;
            }

            if (renderPos >= 0) {
                state.rect(renderPos, 0, 3, state.height, "#EEE");
            }

            date = new Date(date.getFullYear() + 1, 0, 1);

            // Months
            if (state.zoom <= START_ZOOM / 10) {
                continue;
            }
            for (let m = 1; m < 13; m++) {
                let renderPos = state
                    .timeToRenderPos(new Date(date.getFullYear(), m, 1)
                        .getTime() / 1000);

                if (renderPos > 0) {
                    state.rect(renderPos, 0, 2, state.height, "#999");
                }

                // Days
                if (state.zoom <= START_ZOOM / 2) {
                    continue;
                }

                for (let d = 1; d < 32; d++) {
                    let dayTime = new Date(date.getFullYear(), m, d);
                    let renderPos = state.timeToRenderPos(dayTime.getTime() / 1000);
                    const isStartOfWeek = dayTime.getDay() === 1;
                    if (renderPos > 0) {
                        state.rect(renderPos, 0, isStartOfWeek ? 2 : 1,
                            state.height, "#444");
                    }
                }
            }
        }
    });
</script>

<slot></slot>