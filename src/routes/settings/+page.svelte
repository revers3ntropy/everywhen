<script lang="ts">
    import { Settings as SettingsController } from '../../lib/controllers/settings';
    import Settings from './Settings.svelte';

    export let data: App.PageData;
</script>

<svelte:head>
    <title>Settings</title>
    <meta content="Settings" name="description" />
</svelte:head>

<main>
    {#each Object.keys(SettingsController.config) as key}
        <Settings
            {key}
            {...SettingsController.config[key]}
            {...data.settings[key]}
            auth={data}
        />
        <hr>
    {/each}
</main>

<style lang="less">
    hr {
        margin: 1.5rem;
    }
</style>