<script lang="ts">
    import { beforeNavigate } from '$app/navigation';
    import { onMount, setContext } from 'svelte';
    import { errorLogger } from '$lib/utils/log';
    import {
        type CanvasContext,
        CanvasState,
        canvasState,
        type ContextMenuElement,
        contextMenuState,
        type ICanvasState,
        key,
        type Listener
    } from './canvasState';

    export let killLoopOnError = true;
    export let attributes: CanvasRenderingContext2DSettings = {};

    let listeners: Listener[] = [];
    let frame: number;
    let canvas: HTMLCanvasElement;

    let setupCanvas = false;

    onMount(() => {
        const state = CanvasState.empty();
        state.canvas = canvas;
        state.ctx = canvas.getContext('2d', attributes);
        canvasState.set(state);

        // setup entities
        for (const entity of listeners) {
            if (entity.setup) {
                const p = entity.setup($canvasState.asRenderProps());
                if (p && 'then' in p) {
                    void p.then(() => {
                        entity.ready = true;
                    });
                    continue;
                }
            }
            entity.ready = true;
        }

        setupCanvas = true;

        // start game loop
        const stop = createLoop((elapsed, dt) => {
            canvasState.update(s => {
                s.time = elapsed;
                return s;
            });
            render(dt);
        });
        return () => stop();
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
                errorLogger.error(err);
                if (killLoopOnError) {
                    cancelAnimationFrame(frame);
                    console.warn('Animation loop stopped due to an error');
                }
            }
        }

        $canvasState.flushRenderQueue();

        if (canvas) {
            canvas.style.cursor = $canvasState.cursor;
        }
        $canvasState.cursor = 'default';

        $canvasState.ctx.restore();
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
                errorLogger.error(`Invalid listener for ${fn}`, listener);
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

    function ctxMenuAction(item: ContextMenuElement) {
        return (event: MouseEvent) => {
            void item.action?.(
                $canvasState.asRenderProps(),
                $canvasState.getMouseXRaw(event),
                $canvasState.getMouseYRaw(event)
            );
            contextMenuState.set(null);
        };
    }

    beforeNavigate(() => {
        cancelAnimationFrame(frame);
    });
</script>

<canvas
    bind:this={canvas}
    width={$canvasState.width * $canvasState.pixelRatio}
    height={$canvasState.height * $canvasState.pixelRatio}
    style="width: {$canvasState.width}px; height: {$canvasState.height}px;"
    on:mousedown={canvasListener('mousedown')}
    on:mouseup={canvasListener('mouseup')}
    on:mousemove={canvasListener('mousemove')}
    on:touchstart={canvasListener('touchstart')}
    on:touchend={canvasListener('touchend')}
    on:touchmove={canvasListener('touchmove')}
    on:wheel={canvasListener('wheel')}
    on:contextmenu={canvasListener('contextmenu')}
/>

{#if $contextMenuState}
    <div
        class="context-menu"
        style="top: {$contextMenuState.y}px; left: {$contextMenuState.x}px"
    >
        {#each $contextMenuState.options as ctxItem}
            <div class="context-menu-item">
                <button on:click={ctxMenuAction(ctxItem)}>
                    {ctxItem.label}
                </button>
            </div>
        {/each}
    </div>
{/if}

<svelte:window on:resize|passive={() => $canvasState.handleResize()} />
<slot />

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/layout';

    .context-menu {
        .container-shadow();
        position: absolute;
        top: 0;
        left: 0;
        width: fit-content;
        min-width: 200px;
        border-radius: @border-radius;
        z-index: 10;
        background: var(--light-accent);
        padding: 1rem 0;

        .context-menu-item {
            padding: 6px;

            button {
                color: var(--text-color);
                width: 100%;
                text-align: left;
            }

            &:hover {
                background: var(--v-light-accent);
            }
        }
    }
</style>
