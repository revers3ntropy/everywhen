<script lang="ts">
    import { renderable } from "../../lib/canvas/canvas";
    import type { Label } from "../../lib/types";
    import { wordCount } from "./utils";

    export let id: string;
    export let created: number;
    export let title: string;
    export let deleted: boolean;
    export let entry: string;
    export let label: Label | null = null;

    renderable(props => {
        const { width } = props;

        const renderPos = props.timeToRenderPos(created);
        if (renderPos < 0 || renderPos > width) return;

        const size = Math.max(wordCount(entry) * 0.1, 5);

        props.rect(renderPos, props.centerLnY, 5, size, "rgb(100, 100, 100)");
    });
</script>

<slot></slot>