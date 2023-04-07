<script lang="ts">
    import { canvasState, renderable } from '../../lib/canvas/canvasHelpers';

    renderable({
        setup () {

            let dragging = false;
            let dragStart = 0;
            let dragEnd = 0;
            let dragYStart = 0;
            let dragYEnd = 0;

            function doZoom (deltaZ: number) {
                canvasState.update(s => {
                    let centerTime = s.renderPosToTime(s.width / 2);
                    s.zoom *= deltaZ;

                    s.zoom = Math.max(Math.min(100, s.zoom), 1e-10);

                    let newCenterTime = s.renderPosToTime(s.width / 2);
                    s.cameraOffset -= (newCenterTime - centerTime) * s.zoom;

                    return s;
                });
            }

            $canvasState.listen('wheel', evt => {
                evt.preventDefault();
                doZoom(1 + (evt.deltaY * -0.001));
            });

            // desktop
            $canvasState.listen('mousedown', event => {
                dragStart = $canvasState
                    .getMousePosRaw(event);
                dragging = true;
            });

            $canvasState.listen('mouseup', () => {
                dragging = false;
            });

            $canvasState.listen('mousemove', evt => {
                if (!dragging) return;
                canvasState.update(s => {
                    dragEnd = s.getMousePosRaw(evt);
                    s.cameraOffset -= (dragEnd - dragStart) * s.zoom;
                    return s;
                });
                dragStart = dragEnd;
            });

            // mobile
            $canvasState.listen('touchstart', event => {
                dragStart = $canvasState.getMousePosRaw(event);
                dragYStart = $canvasState.getMouseYRaw(event);
                dragging = true;
            });

            $canvasState.listen('touchend', () => {
                dragging = false;
            });

            $canvasState.listen('touchmove', evt => {
                evt.preventDefault();
                if (!dragging) return;

                dragEnd = $canvasState.getMousePosRaw(evt);

                canvasState.update(s => {
                    s.cameraOffset -= (dragEnd - dragStart) * s.zoom * 0.3;
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
        },
    });
</script>

<slot></slot>