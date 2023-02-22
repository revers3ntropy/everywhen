<script lang="ts">
    import { renderable } from "../../lib/canvas/canvas";

    renderable(state => {
        state.rect(0, state.centerLnY() - 1, state.width, 3);
    });
</script>

<slot></slot>