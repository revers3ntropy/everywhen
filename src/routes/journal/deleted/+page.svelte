<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJzsKICAgIGltcG9ydCB7IGdldE5vdGlmaWNhdGlvbnNDb250ZXh0IH0gZnJvbSAnc3ZlbHRlLW5vdGlmaWNhdGlvbnMnOwogICAgaW1wb3J0IHR5cGUgeyBBcHAgfSBmcm9tICcuLi8uLi8uLi9hcHAnOwogICAgaW1wb3J0IERvdCBmcm9tICcuLi8uLi8uLi9saWIvY29tcG9uZW50cy9Eb3Quc3ZlbHRlJzsKICAgIGltcG9ydCBFbnRyeSBmcm9tICcuLi8uLi8uLi9saWIvY29tcG9uZW50cy9FbnRyeS5zdmVsdGUnOwogICAgaW1wb3J0IHR5cGUgeyBFbnRyeSBhcyBFbnRyeUNvbnRyb2xsZXIgfSBmcm9tICcuLi8uLi8uLi9saWIvY29udHJvbGxlcnMvZW50cnknOwogICAgaW1wb3J0IHsgb2JmdXNjYXRlZCB9IGZyb20gJy4uLy4uLy4uL2xpYi9zdG9yZXMnOwogICAgaW1wb3J0IHsgYXBpIH0gZnJvbSAnLi4vLi4vLi4vbGliL3V0aWxzL2FwaVJlcXVlc3QnOwogICAgaW1wb3J0IHsgZGlzcGxheU5vdGlmT25FcnIgfSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMvbm90aWZpY2F0aW9ucyc7CgogICAgY29uc3QgeyBhZGROb3RpZmljYXRpb24gfSA9IGdldE5vdGlmaWNhdGlvbnNDb250ZXh0KCk7CgogICAgZXhwb3J0IGxldCBkYXRhOiBBcHAuUGFnZURhdGE7CgogICAgbGV0IHNlYXJjaCA9ICcnOwogICAgbGV0IGxvYWRlZCA9IGZhbHNlOwogICAgbGV0IGVudHJpZXM6IEVudHJ5Q29udHJvbGxlcltdID0gW107CgogICAgYXN5bmMgZnVuY3Rpb24gcmVsb2FkICgpIHsKICAgICAgICBjb25zdCBlbnRyaWVzT3B0aW9ucyA9IHsKICAgICAgICAgICAgcGFnZTogMCwKICAgICAgICAgICAgcGFnZVNpemU6IDEwZTEwLAogICAgICAgICAgICBzZWFyY2gsCiAgICAgICAgICAgIGRlbGV0ZWQ6IDEsCiAgICAgICAgfTsKICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBhcGkKICAgICAgICAgICAgLmdldChkYXRhLCBgL2VudHJpZXNgLCBlbnRyaWVzT3B0aW9ucykKICAgICAgICAgICAgLnRoZW4ocmVzID0+IGRpc3BsYXlOb3RpZk9uRXJyKGFkZE5vdGlmaWNhdGlvbiwgcmVzKSk7CgogICAgICAgIGVudHJpZXMgPSByZXMuZW50cmllczsKICAgICAgICBsb2FkZWQgPSB0cnVlOwogICAgfQoKICAgIG9uTW91bnQocmVsb2FkKTsKCiAgICBvbk1vdW50KCgpID0+IChkb2N1bWVudC50aXRsZSA9IGBEZWxldGVkYCkpOwo=">{}</script>

<svelte:head>
    <title>Deleted</title>
    <meta content="Deleted" name="description" />
</svelte:head>

<main>
    <h1>
        Bin
        {#if entries.length > 0}
            <Dot />
            {entries.length}
        {/if}
    </h1>
    {#each entries as entry}
        <Entry
            {...entry}
            obfuscated="{$obfuscated}"
            on:updated="{reload}"
            auth="{data}"
        />
    {/each}

    {#if !loaded}
        <h2><i>Loading...</i></h2>
    {:else if entries.length === 0}
        <h2><i>No deleted entries.</i></h2>
    {/if}
</main>

<style lang="less" ✂prettier:content✂="CiAgICBoMiB7CiAgICAgICAgd2lkdGg6IDEwMCU7CiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyOwogICAgfQo="></style>