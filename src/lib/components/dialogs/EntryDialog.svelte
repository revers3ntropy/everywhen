<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJzsKICAgIGltcG9ydCB7IGdldE5vdGlmaWNhdGlvbnNDb250ZXh0IH0gZnJvbSAnc3ZlbHRlLW5vdGlmaWNhdGlvbnMnOwogICAgaW1wb3J0IHR5cGUgeyBFbnRyeSBhcyBFbnRyeUNvbnRyb2xsZXIgfSBmcm9tICcuLi8uLi9jb250cm9sbGVycy9lbnRyeSc7CiAgICBpbXBvcnQgdHlwZSB7IEF1dGggfSBmcm9tICcuLi8uLi9jb250cm9sbGVycy91c2VyJzsKICAgIGltcG9ydCB7IHBvcHVwIH0gZnJvbSAnLi4vLi4vc3RvcmVzJzsKICAgIGltcG9ydCB7IGFwaSwgYXBpUGF0aCB9IGZyb20gJy4uLy4uL3V0aWxzL2FwaVJlcXVlc3QnOwogICAgaW1wb3J0IHsgZGlzcGxheU5vdGlmT25FcnIgfSBmcm9tICcuLi8uLi91dGlscy9ub3RpZmljYXRpb25zJzsKICAgIGltcG9ydCBCb29rU3Bpbm5lciBmcm9tICcuLi9Cb29rU3Bpbm5lci5zdmVsdGUnOwogICAgaW1wb3J0IEVudHJ5IGZyb20gJy4uL0VudHJ5LnN2ZWx0ZSc7CgogICAgY29uc3QgeyBhZGROb3RpZmljYXRpb24gfSA9IGdldE5vdGlmaWNhdGlvbnNDb250ZXh0KCk7CgogICAgZXhwb3J0IGxldCBpZDogc3RyaW5nOwogICAgZXhwb3J0IGxldCBhdXRoOiBBdXRoOwogICAgZXhwb3J0IGxldCBvYmZ1c2NhdGVkID0gZmFsc2U7CgogICAgbGV0IGVudHJ5OiBFbnRyeUNvbnRyb2xsZXIgfCBudWxsID0gbnVsbDsKCiAgICBvbk1vdW50KGFzeW5jICgpID0+IHsKICAgICAgICBlbnRyeSA9IGRpc3BsYXlOb3RpZk9uRXJyKAogICAgICAgICAgICBhZGROb3RpZmljYXRpb24sCiAgICAgICAgICAgIGF3YWl0IGFwaS5nZXQoYXV0aCwgYXBpUGF0aCgnL2VudHJpZXMvPycsIGlkKSksCiAgICAgICAgICAgIHt9LAogICAgICAgICAgICAoKSA9PiBwb3B1cC5zZXQobnVsbCksCiAgICAgICAgKTsKICAgIH0pOwo=">{}</script>

<div>
    {#if entry}
        <Entry
            {...entry}
            isInDialog="{true}"
            auth="{auth}"
            obfuscated="{obfuscated}"
            showFullDate="{true}"
        />
    {:else}
        <BookSpinner />
    {/if}
</div>

<style lang="less" ✂prettier:content✂="CiAgICBkaXYgewogICAgICAgIG1pbi1oZWlnaHQ6IGNhbGMoMTAwdmggLSAxMDBweCk7CiAgICB9Cg=="></style>