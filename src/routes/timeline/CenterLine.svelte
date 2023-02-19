<script lang="ts">
    import { renderable } from "../../lib/canvas/canvas";

    renderable(props => {
        console.log("CenterLine before");
        props.rect(0, props.centerLnY - 1, props.width, 3);
        console.log("CenterLine after");
    });
</script>

<slot></slot>