<script lang="ts">
    import { onMount, setContext } from "svelte";

    import {
        key,
        width,
        height,
        canvas as canvasStore,
        ctx as contextStore,
        pixelRatio,
        props,
        time
    } from "./canvas";
    import { CtxProps } from "./canvas";

    export let killLoopOnError = true;
    export let attributes = {};

    interface Listener {
        setup?: (props: CtxProps) => void | Promise<void>;
        render?: (props: CtxProps, dt: number) => void;
        ready: boolean;
        mounted: boolean;
    }

    let listeners: Listener[] = [];
    let canvas;
    let context;
    let frame;

    let setupCanvas = false;

    onMount(() => {
        // prepare canvas stores
        context = canvas.getContext("2d", attributes);
        canvasStore.set(canvas);
        contextStore.set(context);

        console.log("setup canvas");

        // setup entities
        listeners.forEach(async entity => {
            if (entity.setup) {
                let p = entity.setup(new CtxProps($props as Required<CtxProps>));
                if (p && p.then) await p;
            }
            entity.ready = true;
        });

        setupCanvas = true;

        // start game loop
        return createLoop((elapsed, dt) => {
            time.set(elapsed);
            render(dt);
        });
    });

    setContext(key, {
        add (fn) {
            (async () => {
                if (setupCanvas) {
                    if (fn.setup) {
                        let p = fn.setup(new CtxProps($props as Required<CtxProps>));
                        if (p && p.then) await p;
                    }
                    fn.ready = true;
                }
                this.remove(fn);
                listeners.push(fn);
            })();
        },
        remove (fn) {
            const idx = listeners.indexOf(fn);
            if (idx >= 0) {
                listeners.splice(idx, 1);
            }
        }
    });

    function render (dt) {
        context.save();
        context.scale($pixelRatio, $pixelRatio);
        listeners.forEach(entity => {
            try {
                if (entity.mounted && entity.ready && entity.render) {
                    entity.render(new CtxProps($props as Required<CtxProps>), dt);
                }
            } catch (err) {
                console.error(err);
                if (killLoopOnError) {
                    cancelAnimationFrame(frame);
                    console.warn("Animation loop stopped due to an error");
                }
            }
        });
        context.restore();
    }

    function handleResize () {
        width.set(window.innerWidth);
        height.set(window.innerHeight);
        pixelRatio.set(window.devicePixelRatio);
    }

    function createLoop (fn) {
        let elapsed = 0;
        let lastTime = performance.now();

        function loop () {
            frame = requestAnimationFrame(loop);
            const beginTime = performance.now();
            const dt = (beginTime - lastTime) / 1000;
            lastTime = beginTime;
            elapsed += dt;
            fn(elapsed, dt);
        }

        loop();
        return () => {
            cancelAnimationFrame(frame);
        };
    }
</script>

<canvas
    bind:this={canvas}
    width={$width * $pixelRatio}
    height={$height * $pixelRatio}
    style="width: {$width}px; height: {$height}px;"
></canvas>
<svelte:window on:resize|passive={handleResize} />
<slot></slot>

