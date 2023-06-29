<script lang="ts">
    export let light = false;
    export let marginX: Pixels = 6;
</script>

<span class={light ? 'text-light' : ''} style="margin: 0 {marginX}px"> &#x2022; </span>
