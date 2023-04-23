<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJzsKICAgIGltcG9ydCBFbnRyaWVzIGZyb20gJy4uLy4uL2xpYi9jb21wb25lbnRzL0VudHJpZXMuc3ZlbHRlJzsKICAgIGltcG9ydCB7IG9iZnVzY2F0ZWQgfSBmcm9tICcuLi8uLi9saWIvc3RvcmVzJzsKICAgIGltcG9ydCBFbnRyeUZvcm0gZnJvbSAnLi9FbnRyeUZvcm0uc3ZlbHRlJzsKCiAgICBleHBvcnQgbGV0IGRhdGE6IEFwcC5QYWdlRGF0YTsKCiAgICBsZXQgY2xlYXJFbnRyeUZvcm06ICgpID0+IHZvaWQ7CiAgICBsZXQgcmVsb2FkRW50cmllczogKCkgPT4gUHJvbWlzZTx2b2lkPjsKCiAgICBvbk1vdW50KCgpID0+IChkb2N1bWVudC50aXRsZSA9IGBKb3VybmFsYCkpOwo=">{}</script>

<svelte:head>
    <title>Journal</title>
    <meta content="Journal" name="description" />
</svelte:head>

<main>
    <EntryForm
        auth="{data}"
        bind:reset="{clearEntryForm}"
        obfuscated="{$obfuscated}"
        on:updated="{reloadEntries}"
    />
    <Entries
        auth="{data}"
        bind:reload="{reloadEntries}"
        pageSize="{data.settings.entriesPerPage.value}"
        showBin="{true}"
        showImport="{true}"
        showLabels="{true}"
        showSearch="{true}"
        showSidebar="{true}"
    />
</main>