<script lang="ts">
    import { renderable, START_ZOOM } from "../../lib/canvas/canvas";

    renderable(props => {
        // center screen
        let centerTime = props.renderPosToTime(props.width / 2);
        let centerTimeDate = new Date(centerTime * 1000);

        props.text(
            centerTimeDate.toDateString(),
            props.width / 2,
            props.centerLnY - 30,
            { c: "#6FA" }
        );
        if (props.zoom > START_ZOOM) {
            props.text(
                centerTimeDate.toLocaleTimeString(),
                props.width / 2,
                props.centerLnY - 40,
                { c: "#6FA" }
            );
        }

        props.rect(
            props.width / 2,
            props.centerLnY - 20,
            1,
            40,
            "#6FA"
        );
    });
</script>

<slot></slot>