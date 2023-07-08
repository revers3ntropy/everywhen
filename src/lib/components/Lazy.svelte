<script context="module" lang="ts">
    import type { SvelteComponent } from 'svelte';

    type Component = {
        default: typeof SvelteComponent<
            Record<string, unknown>,
            Record<string, unknown>,
            Record<string, unknown>
        >;
    };

    const moduleCache = new Map<string, Component>();
</script>

<script lang="ts">
    export let shouldLoad = false;
    export let key: string;
    export let component: () => Promise<Component>;
    export let props: Record<string, unknown> = {};

    async function load() {
        const fromCache = moduleCache.get(key);
        if (fromCache) {
            loadedComponent = fromCache;
            return;
        }

        loadedComponent = await component();

        moduleCache.set(key, loadedComponent);
    }

    let loadedComponent = null as null | Component;

    $: if (shouldLoad) void load();
</script>

{#if shouldLoad && loadedComponent}
    {@const LoadedComponent = loadedComponent.default}
    <LoadedComponent {...props} />
{/if}
