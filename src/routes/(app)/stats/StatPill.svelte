<script lang="ts">
    export let value: number | string;
    export let beforeLabel = '';
    export let label: string;
</script>

<div>
    {beforeLabel}
    <span class="font-bold">{value.toLocaleString()}</span>
    {label}
</div>
