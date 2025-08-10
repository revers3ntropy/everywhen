<script lang="ts">
    import { theme } from '$lib/stores';

    // logo dimensions
    const WIDTH = 512;
    const HEIGHT = 512;

    export let scale = 1 / 4;
</script>

<img src="/logo-{$theme}.png" alt="Logo" height={HEIGHT * scale} width={WIDTH * scale} />
