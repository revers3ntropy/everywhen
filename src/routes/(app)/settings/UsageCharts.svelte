<script lang="ts">
    import { Progress } from '$lib/components/ui/progress/index.js';
    import { capitalise } from '$lib/utils/text';

    export let usageData: Record<string, [number, number]>;
</script>

<div>
    <div>
        {#each Object.entries(usageData) as [key, [value, max]]}
            <div class="py-2">
                <div class="flex items-center justify-between">
                    <p class="text-lg">
                        {capitalise(key)}
                    </p>
                    <div class:text-warning={value >= max}>
                        <span class="font-bold">{value}</span>
                        / {max}
                    </div>
                </div>
                <Progress {value} {max} />
            </div>
        {/each}
    </div>
</div>
