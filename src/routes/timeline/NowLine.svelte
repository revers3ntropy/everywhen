<script lang="ts">
    import { renderable } from '../../lib/canvas/canvas';
    import { nowS } from '../../lib/utils/time';

    renderable(state => {
        const nowLinePos = state.timeToRenderPos(nowS());

        if (nowLinePos <= 0) {
            // not on screen
            return;
        }

        state.rect(nowLinePos, 0, 1, state.height, {
            radius: 0,
            colour: '#79ebe2',
        });

        state.text(
            'now',
            nowLinePos - 23,
            72,
            { c: '#79ebe2' },
        );
    });
</script>

<slot></slot>