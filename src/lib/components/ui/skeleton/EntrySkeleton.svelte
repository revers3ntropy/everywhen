<script lang="ts">
    import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

<div class="p-2">
    <div class="flex items-center space-x-2 pb-4">
        <Skeleton class="h-[22px] w-[22px] rounded-full" />
        <Skeleton class="h-[20px] w-full" />
    </div>
    <Skeleton class="h-8 w-[50%] mt-2" />
    <Skeleton class="h-4 w-[200px] mt-2" />
    <Skeleton class="h-4 w-[80%] mt-2" />
</div>
