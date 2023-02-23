<script lang="ts">
    import { obfuscated } from "../../lib/constants";
    import { renderable, START_ZOOM } from "../../lib/canvas/canvas";

    export let id: string;
    export let created: number;
    export let title: string;
    export let wordCount: number;
    export let entryTextParityHeight: boolean;

    renderable(state => {
        const renderPos = state.timeToRenderPos(created);
        if (renderPos < 0 || renderPos > state.width) return;

        const size = Math.max(wordCount * 0.1, 5);

        state.rect(renderPos, state.centerLnY(), 5, size, "rgb(100, 100, 100)");

        if (state.zoom > START_ZOOM * 2 && !$obfuscated) {
            let y = state.centerLnY();

            if (size < 10) {
                y += entryTextParityHeight ? 15 : -10;
            } else {
                y += size + 12;
            }

            state.text(title, renderPos - 5, y, { align: "center" });
        }
    });
</script>

<slot></slot>