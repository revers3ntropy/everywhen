<script lang="ts">
    import type { RenderProps } from '$lib/components/canvas/canvasState';
    import { RectCollider } from '$lib/components/canvas/collider';
    import { interactable } from '$lib/components/canvas/interactable';
    import { nowUtc } from '$lib/utils/time';

    interactable({
        hovering: false,
        render(state) {
            const nowLinePos = state.timeToX(nowUtc(false));

            if (nowLinePos <= 0) {
                // not on screen
                return;
            }

            state.rect(nowLinePos, 0, 1, state.height, {
                color: state.colors.accent
            });

            if (this.hovering) {
                state.text('now', nowLinePos - 35, state.mouseY, {
                    color: state.colors.accent,
                    fontSize: 14
                });
            }
        },

        collider(state: RenderProps) {
            return new RectCollider(state.timeToX(nowUtc(false)) - 10, 0, 20, state.height, {
                zIndex: -2
            });
        }
    });
</script>

<slot />
