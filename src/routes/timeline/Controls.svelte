<script lang="ts">
    import { cameraOffset, props, renderable, zoom } from "../../lib/canvas/canvas";
    import { CtxProps } from "../../lib/canvas/canvas.js";

    renderable({
        setup ({ canvas }) {

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
                let centerTime = $props.renderPosToTime($props.width / 2);

                zoom.update(z => z * deltaZ);

                let newCenterTime = $props.renderPosToTime($props.width / 2);

                cameraOffset.update(v => v - (newCenterTime - centerTime) * $props.doZoom);
            }

            canvas.onwheel = evt => {
                evt.preventDefault();
                doZoom(1 + (evt.deltaY * -0.001));
            };

            // desktop
            canvas.addEventListener("mousedown", event => {
                dragStart = (new CtxProps($props)).getMousePosRaw(event);
                dragging = true;
            });

            canvas.addEventListener("mouseup", () => {
                dragging = false;
            });

            canvas.addEventListener("mousemove", evt => {
                if (dragging) {
                    dragEnd = $props.getMousePosRaw(evt);
                    cameraOffset.update(o => o - (dragEnd - dragStart) * $props.zoom);
                    dragStart = dragEnd;
                }
            });

            // mobile
            canvas.addEventListener("touchstart", event => {
                dragStart = $props.getMousePosRaw(event);
                dragYStart = $props.getMouseYRaw(event);
                dragging = true;
            });

            canvas.addEventListener("touchend", () => {
                dragging = false;
            });

            canvas.addEventListener("touchmove", evt => {
                evt.preventDefault();
                if (dragging) {
                    dragEnd = $props.getMousePosRaw(evt);
                    cameraOffset.update(v => v - (dragEnd - dragStart) * $props.doZoom);
                    dragStart = dragEnd;

                    dragYEnd = $props.getMouseYRaw(evt);
                    let mod = 1 + (dragYEnd - dragYStart) / 1000;
                    if (mod > 0 && mod < 2) {
                        doZoom(mod);
                    }

                    dragYStart = dragYEnd;
                }
            });
        }
    });
</script>

<slot></slot>