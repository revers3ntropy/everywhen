<script lang="ts">
    import { onMount, setContext } from "svelte";
    import { key, canvasState } from "./canvas";
    import type { ICanvasState } from "./canvas";
    import { CanvasState } from "./canvas";

    export let killLoopOnError = true;
    export let attributes: CanvasRenderingContext2DSettings = {};

    interface Listener {
        setup?: (props: CanvasState) => void | Promise<void>;
        render?: (props: CanvasState, dt: number) => void;
        ready: boolean;
        mounted: boolean;
    }

    let listeners: Listener[] = [];
    let frame;
    let canvas: HTMLCanvasElement;

    let setupCanvas = false;

    onMount(async () => {
        const empty = CanvasState.empty();
        empty.canvas = canvas;
        empty.ctx = canvas.getContext("2d", attributes);
        canvasState.set(empty);

        // setup entities
        for (const entity of listeners) {
            if (entity.setup) {
                let p = entity.setup($canvasState);
                if (p && p.then) await p;
            }
            entity.ready = true;
        }

        setupCanvas = true;

        // start game loop
        return createLoop((elapsed, dt) => {
            canvasState.update(s => {
                s.time = elapsed;
                return s;
            });
            render(dt);
        });
    });

    setContext(key, {
        async add (fn) {
            if (setupCanvas) {
                if (fn.setup) {
                    let p = fn.setup($canvasState);
                    if (p && p.then) await p;
                }
                fn.ready = true;
            }
            this.remove(fn);
            listeners.push(fn);
        },
        remove (fn) {
            const idx = listeners.indexOf(fn);
            if (idx >= 0) {
                listeners.splice(idx, 1);
            }
        }
    });

    function render (dt) {
        if (!$canvasState.ctx) throw "Canvas context not initialized";
        $canvasState.ctx.save();
        $canvasState.ctx.scale($canvasState.pixelRatio, $canvasState.pixelRatio);
        for (const entity of listeners) {
            try {
                if (entity.mounted && entity.ready && entity.render) {
                    entity.render($canvasState, dt);
                }
            } catch (err) {
                console.error(err);
                if (killLoopOnError) {
                    cancelAnimationFrame(frame);
                    console.warn("Animation loop stopped due to an error");
                }
            }
        }
        $canvasState.ctx.restore();
    }

    function handleResize () {
        canvasState.update(s => {
            s.width = window.innerWidth;
            s.height = window.innerHeight;
            s.pixelRatio = window.devicePixelRatio;
            return s;
        });
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

    function executeListeners (event: Event, fn: keyof ICanvasState) {
        for (const listener of $canvasState[fn]) {
            listener(event);
        }
    }

    function canvasListener (fn: keyof ICanvasState) {
        return (event: Event) => {
            executeListeners(event, fn);
        };
    }
</script>

<canvas
    bind:this={canvas}

    width={$canvasState.width * $canvasState.pixelRatio}
    height={$canvasState.height * $canvasState.pixelRatio}}
    style="width: {$canvasState.width}px; height: {$canvasState.height}px;"

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

<style lang="less">
    canvas {
        z-index: -1;
    }
</style>

