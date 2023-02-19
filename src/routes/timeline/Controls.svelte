<script lang="ts">
    import { cameraOffset, listenOnCanvas, props, renderable, zoom } from "../../lib/canvas/canvas";
    import { CtxProps } from "../../lib/canvas/canvas.js";

    renderable({
        setup () {

            let dragging = false;
            let dragStart = 0;
            let dragEnd = 0;
            let dragYStart = 0;
            let dragYEnd = 0;

            console.log("setup Controls", dragStart, dragEnd);

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
                console.log("zoom", deltaZ);
                let centerTime = new CtxProps($props)
                    .renderPosToTime($props.width / 2);

                zoom.set($props.zoom * deltaZ);

                let newCenterTime = new CtxProps($props)
                    .renderPosToTime($props.width / 2);

                cameraOffset.update(o => o - ((newCenterTime - centerTime) * $props.zoom));
            }

            listenOnCanvas("wheel", evt => {
                evt.preventDefault();
                doZoom(1 + (evt.deltaY * -0.001));
            });

            // desktop
            listenOnCanvas("mousedown", event => {
                console.log("canvas:", $props.canvas);
                dragStart = (new CtxProps($props))
                    .getMousePosRaw(event);
                dragging = true;
            });

            listenOnCanvas("mouseup", () => {
                dragging = false;
            });

            listenOnCanvas("mousemove", evt => {
                if (dragging) {
                    dragEnd = new CtxProps($props).getMousePosRaw(evt);
                    const zoom = $props.zoom;
                    cameraOffset.update(o => o - (dragEnd - dragStart) * zoom);
                    dragStart = dragEnd;
                }
            });

            // mobile
            listenOnCanvas("touchstart", event => {
                console.log("Touch event!");
                dragStart = new CtxProps($props).getMousePosRaw(event);
                dragYStart = new CtxProps($props).getMouseYRaw(event);
                dragging = true;
            });

            listenOnCanvas("touchend", () => {
                console.log("Touch event!");
                dragging = false;
            });

            listenOnCanvas("touchmove", evt => {
                console.log("Touch event!");
                evt.preventDefault();
                if (dragging) {
                    dragEnd = new CtxProps($props).getMousePosRaw(evt);
                    cameraOffset.update(v => v - (dragEnd - dragStart) * $props.zoom);
                    dragStart = dragEnd;

                    dragYEnd = new CtxProps($props).getMouseYRaw(evt);
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