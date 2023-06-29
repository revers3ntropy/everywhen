<script lang="ts">
    import FilterVariant from 'svelte-material-icons/FilterVariant.svelte';
    import type { Label } from '$lib/controllers/label';
    import type { Auth } from '$lib/controllers/user';
    import Dropdown from '$lib/components/Dropdown.svelte';
    import MultiLabelSelect from '$lib/components/label/MultiLabelSelect.svelte';

    export let auth: Auth;
    export let labels = null as null | Label[];
    export let selectedLabels = [] as string[];
</script>

<div class="wrapper">
    <div class="content">
        <Dropdown fromTop fromRight width="200px" stayOpenWhenClicked>
            <span slot="button" class="filter-button">
                <FilterVariant size="30" />
            </span>
            <div>
                <MultiLabelSelect {auth} {labels} bind:value={selectedLabels} />
            </div>
        </Dropdown>
    </div>
</div>

<style lang="less">
    @import '../../../styles/layout';

    .filter-button {
        .flex-center();
        border-radius: 50%;
        background-color: var(--light-accent);
        aspect-ratio: 1/1;
        padding: 8px;

        &:hover {
            background-color: var(--v-light-accent);
        }
    }

    .content {
        position: absolute;
        bottom: calc(var(--nav-height) + 1rem);
        right: 1rem;
        z-index: 2;
    }
</style>
