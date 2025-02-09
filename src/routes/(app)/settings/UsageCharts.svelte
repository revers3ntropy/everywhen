<script lang="ts">
    import { Progress } from '$lib/components/ui/progress/index.js';
    import type { SubscriptionType } from '$lib/controllers/subscription/subscription';

    export let activeSubscriptionType: SubscriptionType;
</script>

<div>
    <p class="text-lg">Usage</p>
    <div>
        <p class="py-2">
            Entries: <span class="font-bold">30</span> / 100
            <Progress value={30} max={100} />
        </p>
        <p class="py-2">
            Images: <span class="font-bold">2</span> / 10
            <Progress value={2} max={10} />
        </p>
        <p class="py-2">
            Labels: <span class="font-bold">5</span> / 10
            <Progress value={5} max={10} />
        </p>
        <p class="py-2">
            Events: <span class="text-accentDanger">
                <span class="font-bold text-accentDanger">20</span> / 20
            </span>
            <Progress value={20} max={20} />
        </p>
    </div>
</div>
