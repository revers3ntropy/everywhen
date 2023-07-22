<script lang="ts">
    import { renderable } from './renderable';

    export let color: string | null = null;

    renderable(state => {
        state.ctx.clearRect(0, 0, state.width, state.height);
        if (color) {
            state.ctx.fillStyle = color;
            state.ctx.fillRect(0, 0, state.width, state.height);
        }
    });
</script>

<slot />
