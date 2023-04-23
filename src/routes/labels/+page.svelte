<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJzsKICAgIGltcG9ydCBMYWJlbE91dGxpbmUgZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL0xhYmVsT3V0bGluZS5zdmVsdGUnOwogICAgaW1wb3J0IFBsdXMgZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL1BsdXMuc3ZlbHRlJzsKICAgIGltcG9ydCB7IGdldE5vdGlmaWNhdGlvbnNDb250ZXh0IH0gZnJvbSAnc3ZlbHRlLW5vdGlmaWNhdGlvbnMnOwogICAgaW1wb3J0IERvdCBmcm9tICcuLi8uLi9saWIvY29tcG9uZW50cy9Eb3Quc3ZlbHRlJzsKICAgIGltcG9ydCB0eXBlIHsgTGFiZWwgYXMgTGFiZWxDb250cm9sbGVyIH0gZnJvbSAnLi4vLi4vbGliL2NvbnRyb2xsZXJzL2xhYmVsJzsKICAgIGltcG9ydCB7IGFwaSB9IGZyb20gJy4uLy4uL2xpYi91dGlscy9hcGlSZXF1ZXN0JzsKICAgIGltcG9ydCB7IGRpc3BsYXlOb3RpZk9uRXJyIH0gZnJvbSAnLi4vLi4vbGliL3V0aWxzL25vdGlmaWNhdGlvbnMnOwogICAgaW1wb3J0IHsgbm93UyB9IGZyb20gJy4uLy4uL2xpYi91dGlscy90aW1lJzsKICAgIGltcG9ydCBMYWJlbE9wdGlvbnMgZnJvbSAnLi9MYWJlbE9wdGlvbnMuc3ZlbHRlJzsKCiAgICBjb25zdCB7IGFkZE5vdGlmaWNhdGlvbiB9ID0gZ2V0Tm90aWZpY2F0aW9uc0NvbnRleHQoKTsKCiAgICBleHBvcnQgbGV0IGRhdGE6IEFwcC5QYWdlRGF0YSAmIHsKICAgICAgICBsYWJlbHM6IChMYWJlbENvbnRyb2xsZXIgJiB7CiAgICAgICAgICAgIGVudHJ5Q291bnQ6IG51bWJlcjsKICAgICAgICAgICAgZXZlbnRDb3VudDogbnVtYmVyOwogICAgICAgIH0pW107CiAgICB9OwoKICAgIGFzeW5jIGZ1bmN0aW9uIG5ld0xhYmVsICgpIHsKICAgICAgICBsZXQgbmFtZSA9ICdOZXcgTGFiZWwnOwogICAgICAgIGxldCBpID0gMDsKICAgICAgICB3aGlsZSAoZGF0YS5sYWJlbHMuc29tZShsID0+IGwubmFtZSA9PT0gbmFtZSkpIHsKICAgICAgICAgICAgbmFtZSA9IGBOZXcgTGFiZWwgJHsrK2l9YDsKICAgICAgICB9CgogICAgICAgIGNvbnN0IG5ld0xhYmVsID0gewogICAgICAgICAgICBuYW1lLAogICAgICAgICAgICBjb2xvdXI6ICcjMDAwJywKICAgICAgICB9OwoKICAgICAgICBjb25zdCB7IGlkIH0gPSBkaXNwbGF5Tm90aWZPbkVycigKICAgICAgICAgICAgYWRkTm90aWZpY2F0aW9uLAogICAgICAgICAgICBhd2FpdCBhcGkucG9zdChkYXRhLCAnL2xhYmVscycsIG5ld0xhYmVsKSwKICAgICAgICApOwoKICAgICAgICBkYXRhID0gewogICAgICAgICAgICAuLi5kYXRhLAogICAgICAgICAg,ICBsYWJlbHM6IFsKICAgICAgICAgICAgICAgIC4uLmRhdGEubGFiZWxzLAogICAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgICAgIC4uLm5ld0xhYmVsLAogICAgICAgICAgICAgICAgICAgIGlkLAogICAgICAgICAgICAgICAgICAgIGNyZWF0ZWQ6IG5vd1MoKSwKICAgICAgICAgICAgICAgICAgICBlbnRyeUNvdW50OiAwLAogICAgICAgICAgICAgICAgICAgIGV2ZW50Q291bnQ6IDAsCiAgICAgICAgICAgICAgICB9LAogICAgICAgICAgICBdLAogICAgICAgIH07CiAgICB9CgogICAgZnVuY3Rpb24gbGFiZWxEZWxldGVkICh7IGRldGFpbDogeyBpZCB9IH06IHsgZGV0YWlsOiB7IGlkOiBzdHJpbmcgfSB9KSB7CiAgICAgICAgZGF0YSA9IHsKICAgICAgICAgICAgLi4uZGF0YSwKICAgICAgICAgICAgbGFiZWxzOiBkYXRhLmxhYmVscy5maWx0ZXIobCA9PiBsLmlkICE9PSBpZCkKICAgICAgICB9OwogICAgfQoKICAgIG9uTW91bnQoKCkgPT4gKGRvY3VtZW50LnRpdGxlID0gJ0xhYmVscycpKTsK">{}</script>

<svelte:head>
    <title>Labels</title>
    <meta content="Labels" name="description" />
</svelte:head>

<main>
    <h1>
        <LabelOutline size="40" />
        <span>Labels</span>
        {#if data.labels.length > 0}
            <Dot />
            {data.labels.length}
        {/if}
    </h1>
    <div class="labels">
        <div class="label-list">
            {#each data.labels as label}
                <LabelOptions
                    {...label}
                    auth="{data}"
                    on:delete="{labelDeleted}"
                />
            {/each}

            {#if data.labels.length === 0}
                <i class="flex-center text-light">No labels yet</i>
            {/if}

            <div class="flex-center">
                <button class="primary with-icon" on:click="{newLabel}">
                    <Plus size="30" />
                    Create Label
                </button>
            </div>
        </div>
    </div>
</main>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvbGF5b3V0JzsKICAgIEBpbXBvcnQgJy4uLy4uL3N0eWxlcy92YXJpYWJsZXMnOwoKICAgIGgxIHsKICAgICAgICAuZmxleC1jZW50ZXIoKTsKICAgICAgICBtYXJnaW46IDAgMCAxcmVtIDA7CiAgICAgICAgZm9udC1zaXplOiA0MHB4OwoKICAgICAgICBpIHsKICAgICAgICAgICAgZm9udC1zaXplOiAwLjVlbTsKICAgICAgICAgICAgbWFyZ2luLWxlZnQ6IDAuNWVtOwogICAgICAgIH0KCiAgICAgICAgc3BhbiB7CiAgICAgICAgICAgIG1hcmdpbi1sZWZ0OiAwLjJlbTsKICAgICAgICB9CiAgICB9CgogICAgLmxhYmVscyB7CiAgICAgICAgZGlzcGxheTogZ3JpZDsKICAgICAgICBwbGFjZS1jb250ZW50OiBjZW50ZXI7CgogICAgICAgICYgPiAqIHsKICAgICAgICAgICAgbWF4LXdpZHRoOiA1MHJlbTsKICAgICAgICB9CiAgICB9Cg=="></style>