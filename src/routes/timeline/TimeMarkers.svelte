<script lang="ts">
    import { renderable, START_ZOOM } from "../../lib/canvas/canvas";
    import { now } from "./utils";


    renderable(props => {
        let date = new Date(2005, 0, 1);

        // Years
        while (true) {
            let renderPos = props.timeToRenderPos(date.getTime() / 1000);
            if (renderPos > props.width) {
                break;
            }

            if (renderPos >= 0) {
                props.rect(renderPos, 0, 3, props.height, "#EEE");
            }

            date = new Date(date.getFullYear() + 1, 0, 1);

            // Months
            if (props.zoom <= START_ZOOM / 10) {
                continue;
            }
            for (let m = 1; m < 13; m++) {
                let renderPos = props.timeToRenderPos(new Date(date.getFullYear(), m, 1).getTime() / 1000);

                if (renderPos > 0) {
                    props.rect(renderPos, 0, 2, props.height, "#999");
                }

                // Days
                if (props.zoom <= START_ZOOM / 2) {
                    continue;
                }

                for (let d = 1; d < 32; d++) {
                    let dayTime = new Date(date.getFullYear(), m, d);
                    let renderPos = props.timeToRenderPos(dayTime.getTime() / 1000);
                    const isStartOfWeek = dayTime.getDay() === 1;
                    if (renderPos > 0) {
                        props.rect(renderPos, 0, isStartOfWeek ? 2 : 1,
                            props.height, "#444");
                    }
                }
            }
        }

        // now
        props.rect(props.timeToRenderPos(now()), 0, 1, props.height, "#5AA");

        // center screen
        let centerTime = props.renderPosToTime(props.width / 2);
        let centerTimeDate = new Date(centerTime * 1000);

        props.text(centerTimeDate.toDateString(), props.width / 2, props.centerLnY - 30, { c: "#6FA" });
        if (props.zoom > START_ZOOM) {
            props.text(centerTimeDate.toLocaleTimeString(), props.width / 2, props.centerLnY - 40, { c: "#6FA" });
        }

        props.rect(props.timeToRenderPos(centerTime), props.centerLnY - 20, 1, 40, "#6FA");
    });
</script>

<slot></slot>