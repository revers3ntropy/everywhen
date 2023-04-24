<script lang="ts">
    import {
        CanvasState,
        START_ZOOM
    } from '../../lib/canvas/canvasHelpers';
    import { BoxCollider, interactable } from '../../lib/canvas/interactable';
    import type { Auth } from '../../lib/controllers/user';
    import Event from '../../lib/components/Event.svelte';
    import type { Label } from '../../lib/controllers/label';
    import { obfuscated } from '../../lib/stores';
    import { showPopup } from '../../lib/utils/popups';

    const HEIGHT = 30;
    const LABEL_HEIGHT = 4;

    export let auth: Auth;
    export let labels: Label[];

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
        textXOffset: 5
    };

    let thisIsDeleted = false;

    if (!start || !end) throw 'Missing required props';

    const duration = end - start;
    const isSingleEvent = duration < 60;
    const colour = label ? label.colour : CanvasState.colours.primary;

    function yRenderPos (centerLineY: number) {
        return centerLineY - yLevel * (HEIGHT + options.yMargin);
    }

    interactable({
        cursorOnHover: 'pointer',
        render(state, hovering) {
            if (thisIsDeleted) return;

            const x = state.timeToRenderPos(start);
            const y = yRenderPos(state.centerLnY());
            const width = duration * state.zoom;

            if (isSingleEvent) {
                state.circle(x, y + HEIGHT, 5, { colour });
                const h = state.centerLnY() - (y + HEIGHT);
                state.rect(x, y + HEIGHT, 1, h, {
                    radius: 0,
                    colour
                });
            } else {
                state.rect(x, y, width, HEIGHT, {
                    colour: hovering ? '#333' : '#222',
                    radius: 5
                });
                state.rect(x, y + HEIGHT - LABEL_HEIGHT, width, LABEL_HEIGHT, {
                    colour
                });
            }

            let textColour = '#fff';

            if (x + width <= 0) {
                // not on screen
                return;
            }

            if ($obfuscated) return;

            if ((width > 50 || hovering) && !isSingleEvent) {
                state.text(
                    name,
                    Math.max(5, x + options.textXOffset),
                    y + HEIGHT / 2 + 5,
                    {
                        c: textColour
                    }
                );
            } else if (isSingleEvent && state.zoom > START_ZOOM / 2) {
                state.text(
                    name,
                    x + 5,
                    y + HEIGHT / 2 + (eventTextParityHeight ? HEIGHT / 2 + 20 : 0),
                    { c: '#fff', align: 'center' }
                );
            }
        },

        collider(state) {
            if (thisIsDeleted) return null;
            if (isSingleEvent) {
                return new BoxCollider(
                    start - 5,
                    yRenderPos(state.centerLnY()) - 5,
                    10,
                    10
                );
            }
            return new BoxCollider(
                start,
                yRenderPos(state.centerLnY()),
                duration,
                HEIGHT
            )
        },
        onClick() {
            showPopup(Event, {
                auth,
                obfuscated: false,
                event: {
                    id,
                    start,
                    end,
                    name,
                    label,
                    created,
                },
                labels,
                expanded: true,
                changeEventCount (by: number) {
                    if (by === -1) {
                        thisIsDeleted = true;
                    } else if (by === 1) {
                        thisIsDeleted = false;
                    }
                },
                bordered: false,
            })
        }
    });
</script>

<slot />
