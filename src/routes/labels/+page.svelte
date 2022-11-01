<script lang="ts">
    import { api } from "$lib/api/apiQuery";
    import type { Auth } from "../../lib/types";

    export let data: Auth;

    let labels = [];

    function reload () {
        api.get(data, "/labels")
            .then(response => response.json())
            .then(data => {
                labels = data;
            });
    }

    reload();
</script>

<main>

</main>

<style lang="less">

</style>