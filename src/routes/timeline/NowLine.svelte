<script lang="ts">
    import type { RenderProps } from '$lib/canvas/canvasState';
    import { RectCollider } from '$lib/canvas/collider';
    import { interactable } from '$lib/canvas/interactable';
    import { nowUtc } from '$lib/utils/time';

    interactable({
        render(state) {
            const nowLinePos = state.timeToRenderPos(nowUtc(false));

            if (nowLinePos <= 0) {
                // not on screen
                return;
            }

            state.rect(nowLinePos, 0, 1, state.height, {
                colour: state.colours.accentPrimary
            });

            if (this.hovering) {
                state.text('now', nowLinePos - 40, state.mouseY, {
                    colour: '#79ebe2',
                    fontSize: 14
                });
            }
        },

        collider(state: RenderProps) {
            return new RectCollider(
                state.timeToRenderPos(nowUtc(false)) - 10,
                0,
                20,
                state.height,
                { zIndex: -2 }
            );
        }
    });
</script>

<slot />
