<script lang="ts">
    import { CanvasState, renderable, START_ZOOM } from '../../lib/canvas/canvas';
    import type { Label } from '../../lib/controllers/label';
    import { isLightColour } from './utils';

    export let id: string;
    export let start: number;
    export let end: number;
    export let name: string;
    export let label = undefined as Label | undefined;
    export let yLevel: number;
    export let eventTextParityHeight: boolean;
    export let created: number;
    export let decrypted: boolean;
    export let options = {
        h: 20,
        yMargin: 2,
        textXOffset: 1,
        radius: 5,
    };
    if (!start || !end) throw 'Missing required props';

    const duration = end - start;
    const colour = label ? label.colour : CanvasState.c_Primary;

    renderable(state => {
        const x = state.timeToRenderPos(start);
        const y = state.centerLnY() - yLevel * (options.h + options.yMargin);
        const width = duration * state.zoom;
        const isSingleEvent = duration < 60;

        if (isSingleEvent) {
            state.circle(x, y + options.radius * 4,
                options.radius, colour);
            const h = state.centerLnY() - (y + options.radius * 4);
            state.rect(x, y + options.radius * 4, 1, h, colour);
        } else {
            state.rect(x, y, width, options.h, colour);
        }

        let textColour = '#fff';
        if (isLightColour(colour)) {
            textColour = '#000';
        }

        if (x + width <= 0) {
            // not on screen
            return;
        }

        if (width > 50 && !isSingleEvent) {
            state.text(
                name,
                Math.max(5, x + options.textXOffset),
                y + options.h / 2 + 5,
                { c: textColour, mWidth: width },
            );
        } else if (isSingleEvent && state.zoom > START_ZOOM / 2) {
            state.text(
                name,
                x + options.radius,
                y + options.h / 2 + (
                    eventTextParityHeight ? options.radius * 2 + 18 : 0
                ),
                { c: '#fff', align: 'center' },
            );
        }

    });
</script>

<slot></slot>