<script lang="ts">
    import { onMount, setContext } from "svelte";

    import {
        key,
        width,
        height,
        canvas,
        ctx,
        pixelRatio,
        props,
        time, canvasEventListeners
    } from "./canvas";
    import type { ICanvasListeners } from "./canvas";
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
    let frame;

    let setupCanvas = false;

    $: ctx.set($canvas?.getContext("2d", attributes));

    onMount(() => {
        // setup entities
        listeners.forEach(async entity => {
            if (entity.setup) {
                let p = entity.setup(new CtxProps($props));
                if (p && p.then) await p;
            }
            entity.ready = true;
        });

        setupCanvas = true;

        // start game loop
        return createLoop((elapsed, dt) => {
            time.set(elapsed);
            render(dt);
            console.log("after Render");
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
        $ctx.save();
        $ctx.scale($pixelRatio, $pixelRatio);
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
        $ctx.restore();
    }

    function handleResize () {
        width.set(window.innerWidth);
        height.set(window.innerHeight);
        pixelRatio.set(window.devicePixelRatio);
    }

    function createLoop (fn) {

        let elapsed = 0;
        let lastTime = performance.now();

        let timeout;

        function loop () {
            timeout = setTimeout(() => {
                frame = requestAnimationFrame(loop);
                const beginTime = performance.now();
                const dt = (beginTime - lastTime) / 1000;
                lastTime = beginTime;
                elapsed += dt;
                fn(elapsed, dt);
            }, 300);
        }

        loop();
        return () => {
            clearTimeout(timeout);
            cancelAnimationFrame(frame);
        };
    }

    function executeListeners (event: Event, fn: keyof ICanvasListeners) {
        for (const listener of $canvasEventListeners[fn]) {
            listener(event);
        }
    }

    function canvasListener (fn: keyof ICanvasListeners) {
        return (event: Event) => {
            executeListeners(event, fn);
        };
    }

    console.log("RENDERED CANVAS");
</script>

<canvas
    bind:this={$canvas}
    width={$width * $pixelRatio}
    height={$height * $pixelRatio}
    style="width: {$width}px; height: {$height}px;"

    on:mousedown={canvasListener('mousedown')}
    on:mouseup={canvasListener('mouseup')}
    on:mousemove={canvasListener('mousemove')}
    on:touchstart={canvasListener('touchstart')}
    on:touchend={canvasListener('touchend')}
    on:touchmove={canvasListener('touchmove')}
    on:wheel={canvasListener('wheel')}

></canvas>

<svelte:window on:resize|passive={handleResize} />
<slot></slot>

