<script lang="ts">
    import { renderable } from './renderable';

    export let color: string | null = null;

    renderable(({ ctx, width, height }) => {
        ctx.clearRect(0, 0, width, height);
        if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, width, height);
        }
    });
</script>

<slot />
