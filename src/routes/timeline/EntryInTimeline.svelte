<script lang="ts">
    import { START_ZOOM } from '../../lib/canvas/canvasHelpers';
    import { renderable } from '../../lib/canvas/renderable';
    import type { EntryEdit } from '../../lib/controllers/entry';
    import type { Label } from '../../lib/controllers/label';
    import { obfuscated } from '../../lib/stores';

    const WIDTH = 4;

    export let id: string;
    export let created: number;
    export let title: string;
    export let wordCount: number;
    export let entryTextParityHeight: boolean;
    export let decrypted: boolean;
    export let deleted: boolean;
    export let label: Label | null = null;
    export let edits: EntryEdit[] = [];
    export let createdTZOffset = 0;
    export let agentData = '';
    export let latitude = null as number | null;
    export let longitude = null as number | null;

    renderable(state => {
        const renderPos = state.timeToRenderPos(created);
        if (renderPos < 0 || renderPos > state.width) return;

        const size = 0.1 * wordCount + 20;

        state.rect(renderPos - WIDTH / 2, state.centerLnY(), WIDTH, size, {
            radius: 2,
            colour: 'rgb(100, 100, 100)'
        });

        if (label) {
            state.rect(
                renderPos - WIDTH / 2,
                state.centerLnY() + size - 1,
                WIDTH,
                2,
                {
                    colour: label.colour
                }
            );
        }

        if (state.zoom > START_ZOOM * 2 && !$obfuscated) {
            let y = state.centerLnY();

            if (size < 10) {
                y += entryTextParityHeight ? 15 : -10;
            } else {
                y += size + 12;
            }

            state.text(title, renderPos - 5, y, {
                align: 'center'
            });
        }
    });
</script>

<slot />
