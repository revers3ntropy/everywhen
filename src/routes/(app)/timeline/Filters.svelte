<script lang="ts">
    import FilterVariant from 'svelte-material-icons/FilterVariant.svelte';
    import * as Popover from '$lib/components/ui/popover';
    import type { Label } from '$lib/controllers/label/label';
    import MultiLabelSelect from '$lib/components/label/MultiLabelSelect.svelte';

    export let labels: Record<string, Label>;
    export let selectedLabels = [] as string[];
</script>

<div class="content absolute right-4" style="z-index: 2">
    <Popover.Root>
        <Popover.Trigger
            class="bg-lightAccent flex-center gap-2 aspect-square p-2 rounded-full hover:aspect-auto"
        >
            <FilterVariant size="30" />
        </Popover.Trigger>
        <Popover.Content>
            <div>
                <h3 class="pb-2 pl-2">Filter</h3>
                <MultiLabelSelect {labels} bind:value={selectedLabels} />
            </div>
        </Popover.Content>
    </Popover.Root>
</div>

<style lang="scss">
    @import '$lib/styles/layout';

    .content {
        bottom: calc($mobile-nav-height + 1rem + 30px + 16px + 0.5rem);
    }
</style>
