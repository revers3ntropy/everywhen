<script lang="ts">
    import { Button } from '$lib/components/ui/button';
</script>

<h2 class="py-4">Manage your subscription</h2>
<form action="/api/subscription/create-portal-session" method="POST" class="pt-4">
    <Button type="submit">Cancel Subscription</Button>
</form>
