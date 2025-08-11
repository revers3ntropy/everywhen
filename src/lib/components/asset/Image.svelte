<script lang="ts">
    import { tryDecryptText } from '$lib/utils/encryption.client';
    import { notify } from '$lib/components/notifications/notifications';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { browser } from '$app/environment';

    export let obfuscated = false;
    export let fileName: string;
    export let id: string;
    export let publicId: string;

    export let content: string | null = null;

    async function getContent() {
        if (content) return;
        content = notify.onErr(await api.get(apiPath('/assets/?', publicId))).content;
    }

    $: if (browser) getContent();
</script>

{#if content}
    <img
        alt={tryDecryptText(fileName)}
        class:obfuscated
        loading="lazy"
        src="data:image/webp;base64,{tryDecryptText(content)}"
        {id}
    />
{:else}
    Loading...
{/if}
