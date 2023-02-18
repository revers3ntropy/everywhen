<script lang="ts">
    import { renderable } from "../../lib/canvas/canvas";
    import { now } from "./utils";

    renderable(props => {
        props.rect(props.timeToRenderPos(now()), 0, 1, props.height, "#5AA");
    });
</script>

<slot></slot>