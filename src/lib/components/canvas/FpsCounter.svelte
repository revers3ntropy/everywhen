<script lang="ts">
    import { renderable } from '$lib/components/canvas/renderable';

    export let frameTimeThreshold = 25;
    export let rollingAvCount = 15;

    let lastTime = performance.now();
    const frameDurations = new Array<number>(rollingAvCount).fill(1);
    renderable(state => {
        const now = performance.now();
        const delta = now - lastTime;
        lastTime = now;
        frameDurations.push(delta);
        frameDurations.shift();

        const averageFrameTime =
            frameDurations.reduce((a: number, b: number) => a + b, 0) / rollingAvCount;

        if (averageFrameTime < frameTimeThreshold) {
            const fpsFmt = `${(1000 / averageFrameTime).toFixed(1)}fps`;
            state.text(fpsFmt, 10, 70, {
                color: state.colors.lightAccent
            });
        }
    });
</script>
