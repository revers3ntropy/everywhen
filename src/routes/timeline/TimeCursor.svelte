<script lang="ts">
    import { START_ZOOM } from '../../lib/canvas/canvasState';
    import { renderable } from '../../lib/canvas/renderable';
    import { currentTzOffset, fmtUtc } from '../../lib/utils/time';

    renderable(state => {
        // center screen
        const centerTime = state.renderPosToTime(state.width / 2);
        let centerTimeDate = new Date(centerTime * 1000);

        state.text(
            centerTimeDate.toDateString(),
            state.width / 2,
            state.centerLnY() - 30,
            { c: '#6FA' }
        );
        if (state.zoom > START_ZOOM) {
            state.text(
                fmtUtc(centerTime, currentTzOffset(), 'hh:mma'),
                state.width / 2,
                state.centerLnY() - 40,
                { c: '#6FA' }
            );
        }

        state.rect(
            state.timeToRenderPos(centerTime),
            state.centerLnY() - 20,
            1,
            40,
            {
                radius: 0,
                colour: '#6FA'
            }
        );
    });
</script>

<slot />
