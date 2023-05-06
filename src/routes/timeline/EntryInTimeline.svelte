<script lang="ts">
    import { START_ZOOM } from '$lib/canvas/canvasState';
    import { RectCollider } from '$lib/canvas/collider';
    import { interactable } from '$lib/canvas/interactable';
    import EntryDialog from '$lib/dialogs/EntryDialog.svelte';
    import type { EntryEdit } from '$lib/controllers/entry';
    import type { Label } from '$lib/controllers/label';
    import type { Auth } from '$lib/controllers/user';
    import { obfuscated } from '$lib/stores';
    import { showPopup } from '$lib/utils/popups';
    import { limitStrLen } from '$lib/utils/text.js';

    const WIDTH = 4;

    export let auth: Auth;

    export let id: string;
    export let created: number;
    export let title: string;
    export let wordCount: number;
    export let entryTextParityHeight: boolean;
    export let decrypted: boolean;
    export let deleted: boolean;
    export let label: Label | null = null;
    export let edits: EntryEdit[] = [];
    export let createdTZOffset = 0;
    export let agentData = '';
    export let latitude = null as number | null;
    export let longitude = null as number | null;
    export let hideAgentWidget: boolean;

    const height = 0.1 * wordCount + 20;

    interactable({
        cursorOnHover: 'pointer',
        render(state) {
            const renderPos = state.timeToRenderPos(created);
            if (renderPos < 0 || renderPos > state.width) return;

            state.rect(
                renderPos - WIDTH / 2,
                state.centerLnY(),
                WIDTH,
                height,
                {
                    radius: 2,
                    colour: this.hovering
                        ? 'rgb(100, 100, 100)'
                        : 'rgb(200, 200, 200)',
                    zIndex: this.hovering ? 1 : 0
                }
            );

            if (label) {
                state.rect(
                    renderPos - WIDTH / 2,
                    state.centerLnY() + height - 1,
                    WIDTH,
                    2,
                    {
                        colour: label.colour
                    }
                );
            }

            if (
                (this.hovering || state.zoom > START_ZOOM * 2) &&
                !$obfuscated
            ) {
                let y = state.centerLnY();

                if (height < 10) {
                    y += entryTextParityHeight ? 15 : -10;
                } else {
                    y += height + 12;
                }

                state.text(limitStrLen(title, 20), renderPos, y - 5, {
                    align: 'center',
                    backgroundColour: this.hovering ? '#223' : undefined,
                    fontSize: this.hovering ? 14 : 12,
                    backgroundPadding: 4,
                    backgroundRadius: 2
                });
            }
        },

        collider(state) {
            return new RectCollider(
                state.timeToRenderPos(created) - WIDTH / 2 - 1,
                state.centerLnY(),
                WIDTH + 2,
                state.height - state.centerLnY()
            );
        },

        onMouseUp() {
            showPopup(EntryDialog, {
                id,
                auth,
                obfuscated: false,
                hideAgentWidget
            });
        }
    });
</script>

<slot />
