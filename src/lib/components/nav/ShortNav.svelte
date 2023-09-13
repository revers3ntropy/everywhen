<script lang="ts">
    import ShortNavLinks from '$lib/components/nav/ShortNavLinks.svelte';
    import { navExpanded } from '$lib/stores';
    import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
</script>

<div class="grid grid-cols-1 grid-rows-3 h-full w-fit">
    <div class="border-r-br bg-vLightAccent hover:bg-lightAccent h-fit w-fit"> </div>

    <div
        class="fixed bottom-0 left-0 w-full h-fit z-50 flex items-center justify-center md:static md:w-fit md:pl-2 md:h-full"
    >
        <div
            class="flex justify-center w-full bg-vLightAccent bordered overflow-hidden items-center md:rounded-lg md:flex-col"
        >
            <button on:click={() => ($navExpanded = true)} class="only-mobile">
                <ChevronRight size="30" />
            </button>

            <ShortNavLinks />
        </div>
    </div>

    <div class="flex items-end p-4 justify-center hide-mobile">
        <button on:click={() => ($navExpanded = true)}> <ChevronRight size="30" /> </button>
    </div>
</div>
