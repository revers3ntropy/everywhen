<script lang="ts">
    import { renderable, START_ZOOM } from '../../lib/canvas/canvas';

    export let startYear: number;

    renderable(state => {
        let date = new Date(startYear, 0, 1);

        let rightHandSide = state.renderPosToTime(state.width);

        let years = 0;
        // Years
        outer: while (true) {
            let renderPos = state.timeToRenderPos(date.getTime() / 1000);
            if (renderPos > state.width) {
                break;
            }
            years++;
            if (years > 200) {
                break;
            }

            if (renderPos >= 0) {
                state.rect(renderPos, 0, 3, state.height, {
                    radius: 0,
                    colour: '#EEE',
                });
            }

            date = new Date(date.getFullYear() + 1, 0, 1);

            if (date.getTime() / 1000 > rightHandSide) {
                break;
            }

            // Months
            if (state.zoom <= START_ZOOM / 10) {
                continue;
            }

            for (let m = 1; m < 13; m++) {
                let renderPos = state
                    .timeToRenderPos(new Date(date.getFullYear(), m, 1)
                        .getTime() / 1000);

                if (renderPos > 0) {
                    state.rect(renderPos, 0, 2, state.height, {
                        radius: 0,
                        colour: '#999',
                    });
                }

                if (renderPos > state.width) {
                    break outer;
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
                        state.rect(renderPos, 0, isStartOfWeek ? 2 : 1, state.height, {
                            radius: 0,
                            colour: '#444',
                        });
                    }

                    if (renderPos > state.width) {
                        break outer;
                    }

                    // Hours
                    if (state.zoom <= START_ZOOM * 12) {
                        continue;
                    }

                    for (let h = 1; h < 24; h++) {
                        let dayTime = new Date(date.getFullYear(), m, d, h);
                        let renderPos = state.timeToRenderPos(dayTime.getTime() / 1000);
                        const isStartOfWeek = dayTime.getDay() === 1;
                        if (renderPos > 0) {
                            state.rect(renderPos, 0, isStartOfWeek ? 2 : 1, state.height, {
                                radius: 0,
                                colour: '#222',
                            });
                        }

                        if (renderPos > state.width) {
                            break outer;
                        }
                    }
                }
            }
        }
    });
</script>

<slot></slot>