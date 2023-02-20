<script lang="ts">
    import { renderable } from "../../lib/canvas/canvas";

    renderable(props => {
        props.rect(0, props.centerLnY() - 1, props.width, 3);
    });
</script>

<slot></slot>