<script lang="ts">
    import { renderable } from '../../lib/canvas/canvas';
    import { nowS } from '../../lib/utils/time';

    renderable(state => {
        state.rect(state.timeToRenderPos(nowS()), 0, 1, state.height, '#5AA');
    });
</script>

<slot></slot>