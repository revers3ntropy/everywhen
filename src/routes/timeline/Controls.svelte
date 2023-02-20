<script lang="ts">
    import {
        canvasState,
        CanvasState,
        renderable
    } from "../../lib/canvas/canvas";

    renderable({
        setup () {

            let dragging = false;
            let dragStart = 0;
            let dragEnd = 0;
            let dragYStart = 0;
            let dragYEnd = 0;

            // mobile hide and show
            let timer = performance.now();
            const touchDuration = 300;
            let moved = false;

            function toggleText () {
                // showText = !showText;
                // render(data);
            }

            window.addEventListener("keydown", event => {
                if (event.code === "Tab") {
                    toggleText();
                    return false;
                }
            });

            window.addEventListener("touchstart", () => {
                timer = performance.now();
                moved = false;
            });
            window.addEventListener("touchmove", () => {
                moved = true;
            });
            window.addEventListener("touchend", (evt) => {
                if (!moved && performance.now() - timer >= touchDuration) {
                    evt.preventDefault();
                    toggleText();
                }
                moved = false;
            });

            window.addEventListener("contextmenu", (evt) => {
                if (timer) {
                    evt.preventDefault();
                }
            });

            function doZoom (deltaZ) {
                canvasState.update(s => {
                    let centerTime = s.renderPosToTime(s.width / 2);
                    s.zoom *= deltaZ;

                    let newCenterTime = s.renderPosToTime(s.width / 2);
                    s.cameraOffset -= (newCenterTime - centerTime) * s.zoom;

                    return s;
                });
            }

            $canvasState.listen("wheel", evt => {
                evt.preventDefault();
                doZoom(1 + (evt.deltaY * -0.001));
            });

            // desktop
            $canvasState.listen("mousedown", event => {
                dragStart = $canvasState
                    .getMousePosRaw(event);
                dragging = true;
            });

            $canvasState.listen("mouseup", () => {
                dragging = false;
            });

            $canvasState.listen("mousemove", evt => {
                if (dragging) {
                    canvasState.update(s => {
                        dragEnd = s.getMousePosRaw(evt);
                        s.cameraOffset -= (dragEnd - dragStart) * s.zoom;
                        return s;
                    });
                    dragStart = dragEnd;
                }
            });

            // mobile
            $canvasState.listen("touchstart", event => {
                dragStart = $canvasState.getMousePosRaw(event);
                dragYStart = $canvasState.getMouseYRaw(event);
                dragging = true;
            });

            $canvasState.listen("touchend", () => {
                dragging = false;
            });

            $canvasState.listen("touchmove", evt => {
                evt.preventDefault();
                if (!dragging) return;

                dragEnd = $canvasState.getMousePosRaw(evt);

                canvasState.update(s => {
                    s.cameraOffset -= (dragEnd - dragStart) * s.zoom;
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

<slot></slot>