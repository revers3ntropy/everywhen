<script lang="ts">
    import { onMount, setContext } from 'svelte';
    import {
        type CanvasContext,
        CanvasState,
        canvasState,
        type ICanvasState,
        key,
        type Listener
    } from './canvasHelpers';

    export let killLoopOnError = true;
    export let attributes: CanvasRenderingContext2DSettings = {};

    let listeners: Listener[] = [];
    let frame: number;
    let canvas: HTMLCanvasElement;

    let setupCanvas = false;

    onMount(async () => {
        const empty = CanvasState.empty();
        empty.canvas = canvas;
        empty.ctx = canvas.getContext('2d', attributes);
        canvasState.set(empty);

        // setup entities
        for (const entity of listeners) {
            if (entity.setup) {
                let p = entity.setup($canvasState.asRenderProps());
                if (p && 'then' in p) await p;
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

    setContext<CanvasContext>(key, {
        async add(fn: Listener) {
            if (setupCanvas) {
                if (fn.setup) {
                    let p = fn.setup($canvasState.asRenderProps());
                    if (p && 'then' in p) await p;
                }
                fn.ready = true;
            }
            this.remove(fn);
            listeners.push(fn);
        },
        remove(fn: Listener) {
            const idx = listeners.indexOf(fn);
            if (idx >= 0) {
                listeners.splice(idx, 1);
            }
        }
    });

    function render(dt: number) {
        if (!$canvasState.ctx) throw 'Canvas context not initialized';
        $canvasState.ctx.save();
        $canvasState.ctx.scale(
            $canvasState.pixelRatio,
            $canvasState.pixelRatio
        );
        for (const entity of listeners) {
            try {
                if (entity.mounted && entity.ready && entity.render) {
                    void entity.render($canvasState.asRenderProps(), dt);
                }
            } catch (err) {
                console.error(err);
                if (killLoopOnError) {
                    cancelAnimationFrame(frame);
                    console.warn('Animation loop stopped due to an error');
                }
            }
        }

        canvas.style.cursor = $canvasState.cursor;
        $canvasState.cursor = 'default';

        $canvasState.ctx.restore();
    }

    function handleResize() {
        canvasState.update(s => {
            s.width = window.innerWidth;
            s.height = window.innerHeight;
            s.pixelRatio = window.devicePixelRatio;
            return s;
        });
    }

    function createLoop(fn: (elapsed: number, dt: number) => void) {
        let elapsed = 0;
        let lastTime = performance.now();

        function loop() {
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

    function executeListeners(event: Event, fn: keyof ICanvasState) {
        const listeners = $canvasState[fn];
        if (!listeners) throw `No listeners found for ${fn}`;
        if (!Array.isArray(listeners))
            throw `Listeners for ${fn} is not an array`;
        for (const listener of listeners) {
            if (!listener || typeof listener !== 'function') {
                console.error(`Invalid listener for ${fn}`, listener);
                throw new Error();
            }
            listener(event as MouseEvent & TouchEvent & WheelEvent);
        }
    }

    function canvasListener(fn: keyof ICanvasState) {
        return (event: Event) => {
            executeListeners(event, fn);
        };
    }
</script>

<canvas
    bind:this="{canvas}"
    width="{$canvasState.width * $canvasState.pixelRatio}"
    height="{$canvasState.height * $canvasState.pixelRatio}}"
    style="width: {$canvasState.width}px; height: {$canvasState.height}px;"
    class="fullscreen"
    on:mousedown="{canvasListener('mousedown')}"
    on:mouseup="{canvasListener('mouseup')}"
    on:mousemove="{canvasListener('mousemove')}"
    on:touchstart="{canvasListener('touchstart')}"
    on:touchend="{canvasListener('touchend')}"
    on:touchmove="{canvasListener('touchmove')}"
    on:wheel="{canvasListener('wheel')}"></canvas>

<svelte:window on:resize|passive="{handleResize}" />
<slot />
