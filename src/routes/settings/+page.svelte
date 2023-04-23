<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJzsKICAgIGltcG9ydCBBY2NvdW50Q2lyY2xlT3V0bGluZSBmcm9tICdzdmVsdGUtbWF0ZXJpYWwtaWNvbnMvQWNjb3VudENpcmNsZU91dGxpbmUuc3ZlbHRlJzsKICAgIGltcG9ydCBDb2cgZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL0NvZy5zdmVsdGUnOwogICAgaW1wb3J0IExvZ291dCBmcm9tICdzdmVsdGUtbWF0ZXJpYWwtaWNvbnMvTG9nb3V0LnN2ZWx0ZSc7CiAgICBpbXBvcnQgU2t1bGwgZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL1NrdWxsLnN2ZWx0ZSc7CiAgICBpbXBvcnQgeyBnZXROb3RpZmljYXRpb25zQ29udGV4dCB9IGZyb20gJ3N2ZWx0ZS1ub3RpZmljYXRpb25zJzsKICAgIGltcG9ydCBCYWNrdXBPcHRpb25zIGZyb20gJy4uLy4uL2xpYi9jb21wb25lbnRzL0JhY2t1cE9wdGlvbnMuc3ZlbHRlJzsKICAgIGltcG9ydCB7IEJhY2t1cCB9IGZyb20gJy4uLy4uL2xpYi9jb250cm9sbGVycy9iYWNrdXAnOwogICAgaW1wb3J0IHsgU2V0dGluZ3MgYXMgU2V0dGluZ3NDb250cm9sbGVyIH0gZnJvbSAnLi4vLi4vbGliL2NvbnRyb2xsZXJzL3NldHRpbmdzJzsKICAgIGltcG9ydCB7IGFwaSB9IGZyb20gJy4uLy4uL2xpYi91dGlscy9hcGlSZXF1ZXN0JzsKICAgIGltcG9ydCB7IGRpc3BsYXlOb3RpZk9uRXJyIH0gZnJvbSAnLi4vLi4vbGliL3V0aWxzL25vdGlmaWNhdGlvbnMnOwogICAgaW1wb3J0IFNldHRpbmdzIGZyb20gJy4vU2V0dGluZ3Muc3ZlbHRlJzsKCiAgICBjb25zdCB7IGFkZE5vdGlmaWNhdGlvbiB9ID0gZ2V0Tm90aWZpY2F0aW9uc0NvbnRleHQoKTsKCiAgICBleHBvcnQgbGV0IGRhdGE6IEFwcC5QYWdlRGF0YTsKCiAgICBhc3luYyBmdW5jdGlvbiBkZWxldGVBY2NvdW50ICgpIHsKICAgICAgICBpZiAoCiAgICAgICAgICAgICFjb25maXJtKAogICAgICAgICAgICAgICAgJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgeW91ciBhY2NvdW50PycgKwogICAgICAgICAgICAgICAgJyBBIGJhY2t1cCBvZiB5b3VyIGRhdGEgd2lsbCBiZSBkb3dubG9hZGVkLicsCiAgICAgICAgICAgICkKICAgICAgICApIHsKICAgICAgICAgICAgcmV0dXJuOwogICAgICAgIH0KCiAgICAgICAgY29uc3QgeyBiYWNrdXA6IGJhY2t1cERhdGEgfSA9IGRpc3BsYXlOb3RpZk9uRXJyKAogICAgICAgICAgICBhZGROb3RpZmljYXRpb24sCiAgICAgICAgICAgIGF3YWl0IGFwaS5kZWxldGUoZGF0YSwgJy91c2VycycpLAogICAgICAgICk7CiAgICAgICAgQmFja3VwLmRvd25sb2FkKGJhY2t1cERhdGEsIGRhdGEudXNlcm5hbWUsIHRydWUpOwogICAgICAgIGxvY2F0aW9uLmFzc2lnbignLycpOwogICAgfQoKICAgIG9uTW91bnQoKCkgPT4gKGRvY3VtZW50LnRpdGxlID0gJ1NldHRpbmdzJykpOwo=">{}</script>

<svelte:head>
    <title>Settings</title>
    <meta content="Settings" name="description" />
</svelte:head>

<main>
    <section>
        <h1>
            <AccountCircleOutline size="40" />
            <span>My Data and Account</span>
        </h1>

        <div class="buttons">
            <BackupOptions auth="{data}" />
            <a aria-label="Log Out" class="danger" href="/logout">
                <Logout size="30" />
                Log Out
            </a>
            <button
                aria-label="Delete Account"
                class="danger"
                on:click="{deleteAccount}"
            >
                <Skull size="30" />
                Delete Account and Erase Data
            </button>
        </div>
    </section>
    <section>
        <i
        >Please note you will have to reload the page for changes to take
            effect</i
        >
        <h1>
            <Cog size="40" />
            <span>General Settings</span>
        </h1>
        {#each Object.entries(SettingsController.config) as [key, config] (key)}
            <Settings {...config} {...data.settings[key]} auth="{data}" />
        {/each}
    </section>
</main>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvbGF5b3V0JzsKCiAgICBoMSB7CiAgICAgICAgLmZsZXgtY2VudGVyKCk7CiAgICAgICAgbWFyZ2luOiAxcmVtIDAgMCAwOwogICAgICAgIGZvbnQtc2l6ZTogMzhweDsKCiAgICAgICAgc3BhbiB7CiAgICAgICAgICAgIG1hcmdpbi1sZWZ0OiAwLjJlbTsKICAgICAgICB9CgogICAgICAgIEBtZWRpYSBAbW9iaWxlIHsKICAgICAgICAgICAgZm9udC1zaXplOiAzMHB4OwogICAgICAgIH0KICAgIH0KCiAgICBociB7CiAgICAgICAgbWFyZ2luOiAxLjVyZW07CgogICAgICAgICY6bGFzdC1jaGlsZCB7CiAgICAgICAgICAgIGRpc3BsYXk6IG5vbmU7CiAgICAgICAgfQogICAgfQoKICAgIHNlY3Rpb24gewogICAgICAgIG1hcmdpbi10b3A6IDNyZW07CgogICAgICAgIC5idXR0b25zIHsKICAgICAgICAgICAgZGlzcGxheTogZmxleDsKICAgICAgICAgICAgZmxleC13cmFwOiB3cmFwOwoKICAgICAgICAgICAgLy8gZ2xvYmFsIGZvciB0aGUgYmFja3VwIGJ1dHRvbnMsCiAgICAgICAgICAgIC8vIHdoaWNoIGFyZSBpbiBhIGNoaWxkIGNvbXBvbmVudCBidXQgc2hvdWxkIGhhdmUgY29uc2lzdGVudCBzdHlsZQogICAgICAgICAgICAvLyB3aXRoIHRoZSBvdGhlciBidXR0b25zCiAgICAgICAgICAgIGEsCiAgICAgICAgICAgIDpnbG9iYWwoYnV0dG9uKSB7CiAgICAgICAgICAgICAgICAuYm9yZGVyZWQoKTsKICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IEBib3JkZXItcmFkaXVzOwogICAgICAgICAgICAgICAgcGFkZGluZzogMC44cmVtOwogICAgICAgICAgICAgICAgbWFyZ2luOiAwLjVyZW07CiAgICAgICAgICAgICAgICBkaXNwbGF5OiBncmlkOwogICAgICAgICAgICAgICAgcGxhY2UtaXRlbXM6IGNlbnRlcjsKICAgICAgICAgICAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMzVweCAxZnI7CiAgICAgICAgICAgICAgICBjb2xvcjogQGFjY2VudC1jb2xvci1wcmltYXJ5OwoKICAgICAgICAgICAgICAgICY6aG92ZXIgewogICAgICAgICAgICAgICAgICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTsKICAgICAgICAgICAgICAgICAgICBjb2xvcjogQGFjY2VudC1jb2xvci1zZWNvbmRhcnk7CiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogQGxpZ2h0LXYtYWNjZW50OwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CiAgICAgICAgfQogICAgfQo="></style>