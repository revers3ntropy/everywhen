<script lang="ts">
    import { onMount } from 'svelte';
    import { Settings as SettingsController } from '../../lib/controllers/settings';
    import Settings from './Settings.svelte';

    export let data: App.PageData;

    onMount(() => document.title = 'Settings');

</script>

<svelte:head>
    <title>Settings</title>
    <meta content="Settings" name="description" />
</svelte:head>

<main>
    <i>Please note you will have to reload the page for changes to take effect</i>
    <h1>Settings</h1>
    {#each Object.entries(SettingsController.config) as [key, config] (key)}
        <Settings
            {...config}
            {...data.settings[key]}
            auth={data}
        />
        <hr>
    {/each}
</main>

<style lang="less">
    hr {
        margin: 1.5rem;

        &:last-child {
            display: none;
        }
    }
</style>