<script lang="ts">
    import { renderable } from "../../lib/canvas/canvas";

    export let id: string;
    export let created: number;
    export let title: string;
    export let wordCount: string;

    renderable(props => {
        const renderPos = props.timeToRenderPos(created);
        if (renderPos < 0 || renderPos > props.width) return;

        const size = Math.max(wordCount * 0.1, 5);

        props.rect(renderPos, props.centerLnY(), 5, size, "rgb(100, 100, 100)");
    });
</script>

<slot></slot>