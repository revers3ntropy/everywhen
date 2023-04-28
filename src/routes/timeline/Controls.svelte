<script lang="ts">
    import { canvasState } from '$lib/canvas/canvasState';
    import { renderable } from '$lib/canvas/renderable';

    renderable({
        setup(state) {
            let dragging = false;
            let dragStart = 0;
            let dragYStart = 0;
            let dragYEnd = 0;

            function doZoom(deltaZ: number) {
                $canvasState.zoomOnCenter(deltaZ);
            }

            $canvasState.listen('wheel', evt => {
                evt.preventDefault();
                doZoom(1 + evt.deltaY * -0.001);
            });

            // desktop
            $canvasState.listen('mousedown', event => {
                dragStart = $canvasState.getMouseXRaw(event);
                dragging = true;
            });

            $canvasState.listen('mouseup', () => {
                dragging = false;
            });

            $canvasState.listen('mousemove', evt => {
                if (!dragging) return;
                const dragEnd = state.getMouseXRaw(evt);
                canvasState.update(s => {
                    const diff = dragStart - dragEnd;
                    if (diff === 0) return s;
                    s.cameraOffset += diff;
                    return s;
                });
                dragStart = dragEnd;
            });

            // mobile
            $canvasState.listen('touchstart', event => {
                dragStart = $canvasState.getMouseXRaw(event);
                dragYStart = $canvasState.getMouseYRaw(event);
                dragging = true;
            });

            $canvasState.listen('touchend', () => {
                dragging = false;
            });

            $canvasState.listen('touchmove', evt => {
                evt.preventDefault();
                if (!dragging) return;

                const dragEnd = $canvasState.getMouseXRaw(evt);

                canvasState.update(s => {
                    s.cameraOffset += dragStart - dragEnd;
                    return s;
                });
                dragStart = dragEnd;

                dragYEnd = $canvasState.getMouseYRaw(evt);
                let mod = 1 + (dragYEnd - dragYStart) / 1000;
                if (mod > 0 && mod < 2) {
                    doZoom(mod);
                }

                dragYStart = dragYEnd;
            });
        }
    });
</script>

<slot />
