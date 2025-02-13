<script lang="ts">
    export let color: null | string = null;
    export let big = false;
</script>

<span
    style="background: {color}"
    class:h-[20px]={big}
    class:w-[20px]={big}
    class:border-transparent={!color}
    class:border-border={!!color}
    class="inline-block h-[10px] w-[10px] rounded-full border border-solid bg-transparent"
/>
