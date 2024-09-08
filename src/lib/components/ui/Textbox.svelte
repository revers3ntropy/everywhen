<script lang="ts">
    import type { HTMLInputAttributes } from 'svelte/elements';

    export let label: string | undefined = undefined;
    export let value = '';
    export let ariaLabel = label;
    export let autocomplete = 'off';
    export let disabled = false;
    export let element: HTMLInputElement = null as unknown as HTMLInputElement;
    export let id = '';
    export let type = 'text';
    export let autofocus = false;
    export let inputProps: HTMLInputAttributes = {};
    export let thinBorder = false;
    export let fullWidth = false;
    export let startUnit = '';
    export let endUnit = '';
</script>

<label class="group flex flex-col relative mt-2 {fullWidth ? 'w-full' : 'max-w-[300px]'}">
    {#if label}
        <span
            class="{value
                ? 'text-sm translate-y-[-5px] translate-x-[16px]'
                : 'translate-y-[12px] translate-x-[10px]'}
         translate-x-[10px] text-light
         group-focus-within:translate-y-[-5px] group-focus-within:translate-x-[16px] z-10 rounded-full w-full
         transition cursor-text absolute text-lg group-focus-within:text-sm pointer-events-none touch-none"
            class:cursor-not-allowed={disabled}
            style="transition-property: transform, font-size"
        >
            {label}
        </span>
    {/if}

    <span class="flex flex-row items-center" class:pl-2={!!startUnit} class:pr-2={!!endUnit}>
        {startUnit}
        <!-- svelte-ignore a11y-autofocus -->
        <input
            aria-label={ariaLabel}
            {autocomplete}
            bind:this={element}
            bind:value
            {disabled}
            autofocus={autofocus ? true : undefined}
            {id}
            {...{ type }}
            class="text-xl p-3 outline-none w-full cursor-text inline-block relative bg-transparent webkit-autofill:bg-transparent"
            class:pt-2={!label}
            on:keypress
            on:change
            on:input
            on:blur
            on:keydown
            on:keyup
            {...inputProps}
        />
        {endUnit}
    </span>
    <fieldset
        aria-hidden="true"
        class="absolute pointer-events-none touch-none overflow-hidden min-w-[0%]
               {thinBorder ? 'border' : 'border-2'} border-borderColor
               group-hover:border-borderHeavy group-focus-within:group-hover:border-textColorLight
               group-focus-within:border-textColorLight rounded-xl px-2"
        style="inset: -5px 0px 0px"
        class:border-dotted={disabled}
    >
        {#if label}
            <legend
                class="transition visibility-hidden overflow-hidden h-4 pointer-events-none touch-none
                {value ? 'max-w-[100%]' : 'max-w-[0.01px] group-focus-within:max-w-[100%]'}"
                style="transition-propety: max-width"
            >
                <span class="px-2 opacity-0 text-sm pointer-events-none touch-none">{label}</span>
            </legend>
        {/if}
    </fieldset>
</label>
