<script lang="ts">
    import { START_ZOOM } from '$lib/components/canvas/canvasState';
    import { RectCollider } from '$lib/components/canvas/collider';
    import { interactable } from '$lib/components/canvas/interactable';
    import EntryDialog from '$lib/components/dialogs/EntryDialog.svelte';
    import type { EntryEdit } from '$lib/controllers/entry/entry';
    import type { Label } from '$lib/controllers/label/label';
    import { obfuscated } from '$lib/stores';
    import { showPopup } from '$lib/utils/popups';
    import { limitStrLen } from '$lib/utils/text';

    export let id: string;
    export let created: number;
    export let title: string;
    export let wordCount: number;
    export let entryTextParityHeight: boolean;
    export let flags: number;
    export let label = null as Label | null;
    export let edits = [] as EntryEdit[];
    export let createdTZOffset = 0;
    export let agentData = null as string | null;
    export let latitude = null as number | null;
    export let longitude = null as number | null;

    const WIDTH = 4;
    const height = 0.2 * wordCount + 20;

    interactable({
        cursorOnHover: 'pointer',
        hovering: false,
        render(state) {
            const renderPos = state.timeToX(created);
            if (renderPos < 0 || renderPos > state.width) return;

            state.rect(renderPos - WIDTH / 2, state.centerLnY(), WIDTH, height, {
                radius: 2,
                color: this.hovering ? 'rgb(100, 100, 100)' : 'rgb(200, 200, 200)',
                zIndex: this.hovering ? 1 : 0
            });

            if (label) {
                state.rect(renderPos - WIDTH / 2, state.centerLnY() + height - 1, WIDTH, 2, {
                    color: label.color
                });
            }

            if ((this.hovering || state.zoom > START_ZOOM * 2) && !$obfuscated && title) {
                let y = state.centerLnY();

                if (height < 10) {
                    y += entryTextParityHeight ? 15 : -10;
                } else {
                    y += height + 12;
                }

                state.text(limitStrLen(title, 20), renderPos, y - 5, {
                    align: 'center',
                    backgroundColor: this.hovering ? state.colors.primary : undefined,
                    fontSize: this.hovering ? 14 : 12,
                    backgroundPadding: 4,
                    backgroundRadius: 2
                });
            }
        },

        collider(state) {
            return new RectCollider(
                state.timeToX(created) - WIDTH / 2 - 1,
                state.centerLnY(),
                WIDTH + 2,
                state.height - state.centerLnY()
            );
        },

        onMouseDown() {
            showPopup(EntryDialog, {
                id,
                obfuscated: false
            });
        }
    });
</script>

<slot />
