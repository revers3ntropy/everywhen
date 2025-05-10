<script lang="ts">
    import * as Popover from '$lib/components/ui/popover';
    import MenuDown from 'svelte-material-icons/MenuDown.svelte';
    import MenuUp from 'svelte-material-icons/MenuUp.svelte';

    export let options: Record<string, string | number>;
    export let key: string;
    export let open = false;
    export let onChange: null | ((key: string, oldKey: string) => void) = null;

    export let value = options[key];
    $: value = options[key];

    $: if (!(key in options)) key = Object.keys(options)[0];
</script>

<Popover.Root bind:open>
    <Popover.Trigger>
        {key}
        {#if open}
            <MenuUp size="22" />
        {:else}
            <MenuDown size="22" />
        {/if}
    </Popover.Trigger>
    <Popover.Content class="px-0 py-[6px]">
        <div class="min-w-[100px]">
            {#each Object.keys(options) as option}
                <button
                    class="block rounded hover:bg-vLightAccent w-full py-[6px] text-left pl-3"
                    on:click={() => {
                        open = false;
                        if (onChange && key !== option) onChange(option, key);
                        key = option;
                    }}
                    class:font-bold={key === option}
                >
                    {option}
                </button>
            {/each}
        </div>
    </Popover.Content>
</Popover.Root>
