<script lang="ts">
    import { renderable } from "./canvas";

    export let color = null;

    renderable(({ ctx, width, height }) => {
        ctx.clearRect(0, 0, width, height);
        if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, width, height);
        }
    });
</script>

<!-- The following allows this component to nest children -->
<slot></slot>