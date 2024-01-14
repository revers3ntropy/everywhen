<script lang="ts">
    import { theme } from '$lib/stores';

    // logo dimensions
    const WIDTH = 459;
    const HEIGHT = 672;

    export let scale = 1 / 4;

    // use much more compressed version of logo when scale is small
    $: useMin = scale < 0.9;
</script>

<img
    src="/logo{$theme}{useMin ? '-min' : ''}.png"
    alt="Logo"
    height={HEIGHT * scale}
    width={WIDTH * scale}
    style="margin-right: 1rem"
/>
