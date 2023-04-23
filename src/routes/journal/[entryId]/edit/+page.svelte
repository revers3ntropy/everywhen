<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJzsKICAgIGltcG9ydCBDbG9zZSBmcm9tICdzdmVsdGUtbWF0ZXJpYWwtaWNvbnMvQ2xvc2Uuc3ZlbHRlJzsKICAgIGltcG9ydCB0eXBlIHsgRW50cnkgfSBmcm9tICcuLi8uLi8uLi8uLi9saWIvY29udHJvbGxlcnMvZW50cnknOwogICAgaW1wb3J0IHsgb2JmdXNjYXRlZCB9IGZyb20gJy4uLy4uLy4uLy4uL2xpYi9zdG9yZXMnOwogICAgaW1wb3J0IEVudHJ5Rm9ybSBmcm9tICcuLi8uLi9FbnRyeUZvcm0uc3ZlbHRlJzsKCiAgICBleHBvcnQgbGV0IGRhdGE6IEFwcC5QYWdlRGF0YSAmIHsKICAgICAgICBlbnRyeTogRW50cnk7CiAgICB9OwoKICAgIG9uTW91bnQoKCkgPT4gKGRvY3VtZW50LnRpdGxlID0gYEVkaXQgRW50cnlgKSk7Cg==">{}</script>

<svelte:head>
    <title>Edit Entry</title>
    <meta content="Edit Entry" name="description" />
</svelte:head>

<main>
    <div class="header">
        <div>
            <a href="/journal/{data.entry.id}?obfuscate=0">
                <Close size="30" />
            </a>
        </div>
        <h1>Edit Entry</h1>
        <div></div>
    </div>
    <EntryForm
        action="edit"
        auth="{data}"
        entry="{data.entry}"
        loadFromLS="{false}"
        newEntryBody="{data.entry.entry}"
        newEntryLabel="{data.entry?.label?.id || ''}"
        newEntryTitle="{data.entry.title}"
        obfuscated="{$obfuscated}"
    />
</main>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi8uLi8uLi9zdHlsZXMvbGF5b3V0Lmxlc3MnOwoKICAgIC5oZWFkZXIgewogICAgICAgIC5mbGV4LWNlbnRlcigpOwogICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjsKICAgIH0K"></style>