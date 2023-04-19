<script lang="ts">
    import { CanvasState, renderable, START_ZOOM } from '../../lib/canvas/canvasHelpers';
    import type { Label } from '../../lib/controllers/label';
    import { obfuscated } from '../../lib/stores';
    import { isLightColour } from './utils';

    const HEIGHT = 30;
    const LABEL_HEIGHT = 4;

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
        yMargin: 2,
        textXOffset: 5,
    };

    if (!start || !end) throw 'Missing required props';

    const duration = end - start;
    const colour = label ? label.colour : CanvasState.c_Primary;

    renderable(state => {
        const x = state.timeToRenderPos(start);
        const y = state.centerLnY() - yLevel * (HEIGHT + options.yMargin);
        const width = duration * state.zoom;
        const isSingleEvent = duration < 60;

        if (isSingleEvent) {
            state.circle(x, y + HEIGHT,
                5, { colour });
            const h = state.centerLnY() - (y + HEIGHT);
            state.rect(x, y + HEIGHT, 1, h, {
                radius: 0,
                colour,
            });
        } else {
            state.rect(
                x,
                y + HEIGHT - LABEL_HEIGHT,
                width,
                LABEL_HEIGHT,
                { colour },
            );
        }

        let textColour = '#fff';
        if (isLightColour(colour)) {
            textColour = '#000';
        }

        if (x + width <= 0) {
            // not on screen
            return;
        }

        if ($obfuscated) return;

        if (width > 50 && !isSingleEvent) {
            state.text(
                name,
                Math.max(5, x + options.textXOffset),
                y + HEIGHT / 2 + 5,
                { c: textColour, maxWidth: width - 2 * options.textXOffset },
            );
        } else if (isSingleEvent && state.zoom > START_ZOOM / 2) {
            state.text(
                name,
                x + 5,
                y + HEIGHT / 2 + (
                    eventTextParityHeight ? HEIGHT / 2 + 20 : 0
                ),
                { c: '#fff', align: 'center' },
            );
        }

    });
</script>

<slot></slot>