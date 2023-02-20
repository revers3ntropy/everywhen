<script lang="ts">
    import { renderable } from "../../lib/canvas/canvas";
    import { nowS } from "./utils";

    renderable(props => {
        props.rect(props.timeToRenderPos(nowS()), 0, 1, props.height, "#5AA");
    });
</script>

<slot></slot>