<script lang="ts">
    import FilterVariant from 'svelte-material-icons/FilterVariant.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import Dropdown from '$lib/components/ui/Dropdown.svelte';
    import MultiLabelSelect from '$lib/components/label/MultiLabelSelect.svelte';

    export let labels: Record<string, Label>;
    export let selectedLabels = [] as string[];
</script>

<div class="content absolute right-4" style="z-index: 2">
    <Dropdown fromTop fromRight width="200px" stayOpenWhenClicked>
        <span
            slot="button"
            class="bg-lightAccent flex-center gap-2 aspect-square p-2 rounded-full hover:aspect-auto"
        >
            <FilterVariant size="30" />
        </span>
        <div>
            <h3 class="p-2 pb-0">Filter</h3>
            <MultiLabelSelect {labels} bind:value={selectedLabels} />
        </div>
    </Dropdown>
</div>

<style lang="scss">
    @import '$lib/styles/layout';

    .content {
        bottom: calc($mobile-nav-height + 1rem + 30px + 16px + 0.5rem);
    }
</style>
