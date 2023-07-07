<script context="module" lang="ts">
    import type { SvelteComponent } from 'svelte';

    const moduleCache = new Map<string, { default: typeof SvelteComponent }>();
</script>

<script lang="ts">
    import type { SvelteComponent } from 'svelte';

    export let shouldLoad = false;
    export let key: string;
    export let component: () => Promise<{ default: typeof SvelteComponent }>;
    export let props: Record<string, unknown> = {};

    async function load() {
        const fromCache = moduleCache.get(key);
        if (fromCache) {
            loadedComponent = fromCache;
            return;
        }

        console.log(`Loading component ${key}...`);
        loadedComponent = await component();

        moduleCache.set(key, loadedComponent);
    }

    let loadedComponent = null as null | { default: typeof SvelteComponent };

    $: if (shouldLoad) load();
</script>

{#if shouldLoad && loadedComponent}
    {@const LoadedComponent = loadedComponent.default}
    <LoadedComponent {...props} />
{/if}
