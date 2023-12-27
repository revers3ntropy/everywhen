<script lang="ts">
    import { START_ZOOM } from '$lib/components/canvas/canvasState';
    import { interactable } from '$lib/components/canvas/interactable';
    import { Auth } from '$lib/controllers/auth/auth';
    import type { Label } from '$lib/controllers/label/label';
    import { encryptionKey, obfuscated } from '$lib/stores';
    import { limitStrLen } from '$lib/utils/text';

    export let entries: {
        id: string;
        created: number;
        createdTzOffset: number;
        title: string;
        labelId: string;
        wordCount: number;
    }[];
    export let selectedLabelIds: string[];
    export let labels: Record<string, Label>;

    const WIDTH = 4;

    interactable({
        hovering: false,
        render(state) {
            const minTime = state.xToTime(0);
            const maxTime = state.xToTime(state.width);

            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];

                if (entry.labelId && !selectedLabelIds.includes(entry.labelId)) continue;
                if (entry.created < minTime || entry.created > maxTime) continue;

                const height = 0.2 * entry.wordCount + 20;
                const renderPos = state.timeToX(entry.created);

                state.rect(renderPos - WIDTH / 2, state.centerLnY(), WIDTH, height, {
                    radius: 2,
                    color: 'rgb(200, 200, 200)'
                });

                if (entry.labelId) {
                    state.rect(renderPos - WIDTH / 2, state.centerLnY() + height - 1, WIDTH, 2, {
                        color: labels[entry.labelId].color
                    });
                }

                if (!$obfuscated && (this.hovering || state.zoom > START_ZOOM * 2)) {
                    const title = Auth.decryptOrLogOut(entry.title, $encryptionKey);
                    if (!title) continue;

                    let y = state.centerLnY();

                    if (height < 10) {
                        y += i % 2 === 0 ? 15 : -10;
                    } else {
                        y += height + 12;
                    }

                    state.text(limitStrLen(title, 20), renderPos, y - 5, {
                        backgroundColor: this.hovering ? state.colors.primary : undefined,
                        fontSize: this.hovering ? 14 : 12,
                        backgroundPadding: 4,
                        backgroundRadius: 2
                    });
                }
            }
        }
    });
</script>

<slot />
