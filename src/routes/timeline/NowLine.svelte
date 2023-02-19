<script lang="ts">
    import { renderable } from "../../lib/canvas/canvas";
    import { nowS } from "./utils";

    renderable(props => {
        console.log("NowLine before");
        props.rect(props.timeToRenderPos(nowS()), 0, 1, props.height, "#5AA");
        console.log("NowLine after");
    });
</script>

<slot></slot>