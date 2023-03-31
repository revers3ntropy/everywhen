<script lang="ts">
    import { renderable, START_ZOOM } from '../../lib/canvas/canvas';
    import type { EntryEdit } from '../../lib/controllers/entry';
    import type { Label } from '../../lib/controllers/label';
    import { obfuscated } from '../../lib/stores';

    export let id: string;
    export let created: number;
    export let title: string;
    export let wordCount: number;
    export let entryTextParityHeight: boolean;
    export let entry: string;
    export let decrypted: boolean;
    export let deleted: boolean;
    export let label: Label | null = null;
    export let edits: EntryEdit[] = [];
    export let createdTZOffset = 0;

    renderable(state => {
        const renderPos = state.timeToRenderPos(created);
        if (renderPos < 0 || renderPos > state.width) return;

        const size = Math.max(wordCount * 0.1, 5);

        state.rect(renderPos, state.centerLnY(), 5, size, 'rgb(100, 100, 100)');

        if (state.zoom > START_ZOOM * 2 && !$obfuscated) {
            let y = state.centerLnY();

            if (size < 10) {
                y += entryTextParityHeight ? 15 : -10;
            } else {
                y += size + 12;
            }

            state.text(title, renderPos - 5, y, { align: 'center' });
        }
    });
</script>

<slot></slot>