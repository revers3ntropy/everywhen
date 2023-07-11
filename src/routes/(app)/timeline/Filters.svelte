<script lang="ts">
    import FilterVariant from 'svelte-material-icons/FilterVariant.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import type { Auth } from '$lib/controllers/user/user';
    import Dropdown from '$lib/components/Dropdown.svelte';
    import MultiLabelSelect from '$lib/components/label/MultiLabelSelect.svelte';

    export let auth: Auth;
    export let labels = null as null | Label[];
    export let selectedLabels = [] as string[];
</script>

    <div class="content">
        <Dropdown fromTop fromRight width="200px" stayOpenWhenClicked>
            <span slot="button" class="filter-button">
                <span class="button-label"> Filter </span>
                <FilterVariant size="30" />
            </span>
            <div>
                <MultiLabelSelect {auth} {labels} bind:value={selectedLabels} />
            </div>
        </Dropdown>
    </div>

<style lang="less">
    @import '../../../styles/layout';

    .filter-button {
        .flex-center();
        background-color: var(--light-accent);
        border-radius: calc(@border-radius * 2);
        aspect-ratio: 1/1;
        padding: 8px;
        margin: 0;
        transition: width 1s;

        .button-label {
            width: 0;
            display: none;
            transition: width 1s;
        }

        &:hover {
            background-color: var(--v-light-accent);
            aspect-ratio: unset;
            .button-label {
                margin: 0 0.5rem 0 0;
                display: unset;
                width: initial;
            }
        }
    }

    .content {
        position: absolute;
        bottom: calc(var(--nav-height) + 1rem + 30px + 16px + 0.5rem);
        right: 1rem;
        z-index: 2;
    }
</style>
