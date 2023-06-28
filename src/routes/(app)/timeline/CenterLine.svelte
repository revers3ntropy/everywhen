<script lang="ts">
    import { renderable } from '$lib/components/canvas/renderable';

    renderable(state => {
        state.rect(0, state.centerLnY() - 1, state.width, 3);
    });
</script>

<slot />
