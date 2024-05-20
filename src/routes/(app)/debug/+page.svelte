<script lang="ts">
    import { encryptionKey } from '$lib/stores';
    import { decrypt, encrypt } from '$lib/utils/encryption';

    let encryptedInput: HTMLTextAreaElement;
    let decryptedOutput: HTMLTextAreaElement;

    function encryptedChanged() {
        decryptedOutput.value = decrypt(encryptedInput.value, $encryptionKey).or('?');
    }

    function decryptedChanged() {
        encryptedInput.value = encrypt(decryptedOutput.value, $encryptionKey);
    }
</script>

<svelte:head>
    <title>Debug</title>
</svelte:head>

<main class="md:p-4 md:ml-[10.5rem]">
    <div>
        Decrypted
        <textarea
            bind:this={decryptedOutput}
            on:change={decryptedChanged}
            class="md:w-[50vw] bg-vLightAccent"
            rows="10"
        ></textarea>
    </div>
    <div>
        Encrypted
        <textarea
            bind:this={encryptedInput}
            on:change={encryptedChanged}
            class="md:w-[50vw] bg-vLightAccent"
            rows="10"
        ></textarea>
    </div>
</main>
