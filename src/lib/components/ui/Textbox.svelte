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
</script>

<label class="group flex flex-col relative mt-2">
    {#if label}
        <span
            class="{value
                ? 'text-sm translate-y-[-5px] translate-x-[16px]'
                : 'translate-y-[12px] translate-x-[10px]'}
         translate-x-[10px] text-light
         group-focus-within:translate-y-[-5px] group-focus-within:translate-x-[16px] z-10 rounded-full w-fit
         transition cursor-text absolute text-lg group-focus-within:text-sm"
            class:cursor-not-allowed={disabled}
            style="transition-property: transform, font-size"
        >
            {label}
        </span>
    {/if}
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
        class="w-[300px] text-xl p-3 outline-none cursor-text inline-block relative bg-transparent webkit-autofill:bg-transparent"
        on:keypress
        on:change
        on:input
        on:blur
        on:keydown
        on:keyup
        {...inputProps}
    />

    <fieldset
        aria-hidden="true"
        class="absolute pointer-events-none overflow-hidden min-w-[0%] border-2 border-borderColor
               group-hover:border-borderHeavy group-focus-within:group-hover:border-textColorLight
               group-focus-within:border-textColorLight rounded-xl px-2"
        style="inset: -5px 0px 0px"
        class:border-dotted={disabled}
    >
        {#if label}
            <legend
                class="transition visibility-hidden overflow-hidden h-4
                {value ? 'max-w-[100%]' : 'max-w-[0.01px] group-focus-within:max-w-[100%]'}"
                style="transition-propety: max-width"
            >
                <span class="px-2 opacity-0 text-sm">{label}</span>
            </legend>
        {/if}
    </fieldset>
</label>
