<script lang="ts">
    import { START_ZOOM } from '$lib/components/canvas/canvasState';
    import { RectCollider } from '$lib/components/canvas/collider';
    import { interactable } from '$lib/components/canvas/interactable';
    import EntryDialog from '$lib/components/dialogs/EntryDialog.svelte';
    import type { Entry, EntrySummary } from '$lib/controllers/entry/entry';
    import { obfuscated } from '$lib/stores';
    import { showPopup } from '$lib/utils/popups';
    import { limitStrLen } from '$lib/utils/text';

    export let entry: Entry | EntrySummary;
    export let entryTextParityHeight: boolean;

    let title = '';
    if ('title' in entry) title = entry.title;
    else if ('titleShortened' in entry) title = entry.titleShortened;

    const WIDTH = 4;
    const height = 0.2 * entry.wordCount + 20;

    interactable({
        cursorOnHover: 'pointer',
        hovering: false,
        render(state) {
            const renderPos = state.timeToX(entry.created);
            if (renderPos < 0 || renderPos > state.width) return;

            state.rect(renderPos - WIDTH / 2, state.centerLnY(), WIDTH, height, {
                radius: 2,
                color: this.hovering ? 'rgb(100, 100, 100)' : 'rgb(200, 200, 200)',
                zIndex: this.hovering ? 1 : 0
            });

            if (entry.label) {
                state.rect(renderPos - WIDTH / 2, state.centerLnY() + height - 1, WIDTH, 2, {
                    color: entry.label.color
                });
            }

            if (!$obfuscated && title && (this.hovering || state.zoom > START_ZOOM * 2)) {
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
                state.timeToX(entry.created) - WIDTH / 2 - 1,
                state.centerLnY(),
                WIDTH + 2,
                state.height - state.centerLnY()
            );
        },

        onMouseDown() {
            showPopup(EntryDialog, {
                id: entry.id,
                obfuscated: false
            });
        }
    });
</script>

<slot />
