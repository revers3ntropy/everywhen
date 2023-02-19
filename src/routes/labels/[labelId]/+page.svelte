<script lang="ts">
    import type { Data, Label } from "../../../lib/types";
    import Entries from "../../../lib/components/Entries.svelte";

    export let data: Data & {
        label: Label,
        entryCount: number
    };
</script>

<main>
    <div class="colour-select" style="border-color: {data.label.colour}">
        {data.label.colour}
        <input
            value={data.label.colour}
            type="color"
        >
    </div>
    <input class="name editable-text" value={data.label.name}>

    <p>
        Has {data.entryCount} {data.entryCount === 1 ? "entry" : "entries"}
    </p>

    <Entries
        auth={data}
        options={{ labelId: data.label.id }}
        showLabels={false}
    />
</main>

<style lang="less">
    .name {
        font-size: 2em;
        font-weight: bold;
    }

    .colour-select {
        width: calc(100% - 1em);
        border: none;
        border-bottom: 3px solid black;
        font-size: 1em;
        font-weight: bold;
        padding: 0.4em;
        margin: 0.4em 0;
    }
</style>
