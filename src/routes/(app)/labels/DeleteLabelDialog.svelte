<script lang="ts">
    import LabelDot from '$lib/components/label/LabelDot.svelte';
    import { Button } from '$lib/components/ui/button';
    import EncryptedText from '$lib/components/ui/EncryptedText.svelte';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { dispatch } from '$lib/dataChangeEvents';
    import LabelSelect from '$lib/components/label/LabelSelect.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { slide } from 'svelte/transition';

    export let id: string;
    export let color: string;
    export let name: string;
    export let onDelete: undefined | (() => void);
    export let cancel: undefined | (() => void);
    export let labels: Record<string, Label>;

    let changeLabelId: string;

    async function rmLabel() {
        notify.onErr(
            await api.delete(apiPath(`/labels/?`, id), {
                strategy: 'remove'
            })
        );
        await dispatch.delete('label', id);
        if (onDelete) {
            onDelete();
            return;
        }
    }

    async function reassign() {
        if (!changeLabelId) {
            notify.error('Please select a label to reassign to.');
            return;
        }
        notify.onErr(
            await api.delete(apiPath(`/labels/?`, id), {
                strategy: 'reassign',
                newLabelId: changeLabelId
            })
        );
        await dispatch.delete('label', id);
        if (onDelete) {
            onDelete();
            return;
        }
    }

    function filter(label: Label) {
        return label.id !== id;
    }
</script>

<div>
    <div class="pb-4 flex items-center gap-2">
        <p class="text-xl inline-flex items-center gap-2">
            Delete Label

            <LabelDot {color} big />
            <EncryptedText text={name} />
        </p>
    </div>
    <p> There are entries, edits or events with this label. </p>
    <div class="py-2" in:slide={{ duration: ANIMATION_DURATION }}>
        <div
            class="flex items-center justify-between rounded-xl p-2 border border-border border-solid"
        >
            <LabelSelect bind:value={changeLabelId} {filter} {labels} />
            <Button on:click={reassign}>Give different label</Button>
        </div>

        <h2 class="py-4">OR</h2>

        <div
            class="flex items-center justify-between rounded-xl p-2 border border-border border-solid"
        >
            <p />
            <Button on:click={rmLabel}>Remove label</Button>
        </div>

        <div class="pt-8">
            <Button variant="outline" on:click={cancel}>Cancel</Button>
        </div>
    </div>
</div>
