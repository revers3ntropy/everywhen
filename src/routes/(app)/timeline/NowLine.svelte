<script lang="ts">
    import { interactable } from '$lib/components/canvas/interactable';
    import { nowUtc } from '$lib/utils/time';

    interactable({
        render(state) {
            const nowLinePos = state.timeToX(nowUtc(false));

            if (nowLinePos <= 0) {
                // not on screen
                return;
            }

            state.rect(nowLinePos, 0, 1, state.height, {
                color: state.colors.accent
            });
        }
    });
</script>

<slot />
