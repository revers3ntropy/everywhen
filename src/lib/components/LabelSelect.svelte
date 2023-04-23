<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnOwogICAgaW1wb3J0IFBsdXMgZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL1BsdXMuc3ZlbHRlJzsKICAgIGltcG9ydCB7IGdldE5vdGlmaWNhdGlvbnNDb250ZXh0IH0gZnJvbSAnc3ZlbHRlLW5vdGlmaWNhdGlvbnMnOwogICAgaW1wb3J0IERyb3Bkb3duIGZyb20gJy4uLy4uL2xpYi9jb21wb25lbnRzL0Ryb3Bkb3duLnN2ZWx0ZSc7CiAgICBpbXBvcnQgdHlwZSB7IExhYmVsIH0gZnJvbSAnLi4vY29udHJvbGxlcnMvbGFiZWwnOwogICAgaW1wb3J0IHR5cGUgeyBBdXRoIH0gZnJvbSAnLi4vY29udHJvbGxlcnMvdXNlcic7CiAgICBpbXBvcnQgeyBhcGkgfSBmcm9tICcuLi91dGlscy9hcGlSZXF1ZXN0JzsKICAgIGltcG9ydCB7CiAgICAgICAgZGlzcGxheU5vdGlmT25FcnIsCiAgICAgICAgRVJSX05PVElGSUNBVElPTiwKICAgIH0gZnJvbSAnLi4vdXRpbHMvbm90aWZpY2F0aW9ucyc7CiAgICBpbXBvcnQgeyBzaG93UG9wdXAgfSBmcm9tICcuLi91dGlscy9wb3B1cHMnOwogICAgaW1wb3J0IE5ld0xhYmVsRGlhbG9nIGZyb20gJy4vZGlhbG9ncy9OZXdMYWJlbERpYWxvZy5zdmVsdGUnOwoKICAgIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCk7CgogICAgY29uc3QgeyBhZGROb3RpZmljYXRpb24gfSA9IGdldE5vdGlmaWNhdGlvbnNDb250ZXh0KCk7CgogICAgZXhwb3J0IGxldCBsYWJlbHM6IExhYmVsW10gfCBudWxsOwogICAgZXhwb3J0IGxldCB2YWx1ZSA9ICcnOwogICAgZXhwb3J0IGxldCBhdXRoOiBBdXRoOwogICAgZXhwb3J0IGxldCBzaG93QWRkQnV0dG9uID0gdHJ1ZTsKICAgIGV4cG9ydCBsZXQgZmlsdGVyOiAobDogTGFiZWwsIGk6IG51bWJlciwgYXJyOiBMYWJlbFtdKSA9PiBib29sZWFuID0gKCkgPT4KICAgICAgICB0cnVlOwoKICAgIGxldCBjbG9zZURyb3BEb3duOiAoKSA9PiB2b2lkOwoKICAgICQ6IGRpc3BhdGNoKCdjaGFuZ2UnLCB7IGlkOiB2YWx1ZSB9KTsKCiAgICBmdW5jdGlvbiBzaG93TmV3TGFiZWxQb3B1cCAoKSB7CiAgICAgICAgc2hvd1BvcHVwKE5ld0xhYmVsRGlhbG9nLCB7IGF1dGggfSwgYXN5bmMgKCkgPT4gewogICAgICAgICAgICBjb25zdCByZXMgPSBkaXNwbGF5Tm90aWZPbkVycigKICAgICAgICAgICAgICAgIGFkZE5vdGlmaWNhdGlvbiwKICAgICAgICAgICAgICAgIGF3YWl0IGFwaS5nZXQoYXV0aCwgJ,y9sYWJlbHMnKSwKICAgICAgICAgICAgKTsKICAgICAgICAgICAgbGFiZWxzID0gcmVzLmxhYmVsczsKICAgICAgICAgICAgLy8gc2V0IHRvIGxhc3QgY3JlYXRlZCBsYWJlbAogICAgICAgICAgICB2YWx1ZSA9IGxhYmVscy5zb3J0KChhLCBiKSA9PiBiLmNyZWF0ZWQgLSBhLmNyZWF0ZWQpWzBdLmlkOwogICAgICAgIH0pOwogICAgfQoKICAgICQ6IGlmIChsYWJlbHMgJiYgdmFsdWUgIT09ICcnICYmICFsYWJlbHMuZmluZChsID0+IGwuaWQgPT09IHZhbHVlKSkgewogICAgICAgIGNvbnNvbGUuZXJyb3IoYExhYmVsICR7dmFsdWV9IG5vdCBmb3VuZGApOwogICAgICAgIHZhbHVlID0gJyc7CiAgICAgICAgYWRkTm90aWZpY2F0aW9uKHsKICAgICAgICAgICAgLi4uRVJSX05PVElGSUNBVElPTiwKICAgICAgICAgICAgdGV4dDogYENhbid0IGZpbmQgbGFiZWxgCiAgICAgICAgfSk7CiAgICB9Cg==">{}</script>

<div class="select-label">
    <Dropdown bind:close="{closeDropDown}" rounded ariaLabel="Select label">
        <span slot="button" class="select-button">
            <span
                class="entry-label-colour"
                style="background: {(labels ?? []).find(l => l.id === value)
                    ?.colour || 'transparent'}"></span>
            {#if labels}
                {labels.find(l => l.id === value)?.name || '(No Label)'}
            {:else}
                loading...
            {/if}
        </span>
        <div class="list-container">
            <button
                on:click="{() => {
                    closeDropDown();
                    value = '';
                }}"
                class="label-button single"
                aria-label="Remove label"
            >
                <i>No Label</i>
            </button>
            {#each (labels ?? []).filter(filter) as label (label.id)}
                <button
                    on:click="{() => {
                        closeDropDown();
                        value = label.id;
                    }}"
                    class="label-button"
                    aria-label="Select label {label.name}"
                >
                    <span
                        class="entry-label-colour"
                        style="background: {label.colour}"></span>
                    {#if value === label.id}
                        <b>{label.name}</b>
                    {:else}
                        {label.name}
                    {/if}
                </button>
            {/each}
        </div>
    </Dropdown>
    {#if showAddButton}
        <button
            on:click="{showNewLabelPopup}"
            class="icon-button"
            aria-label="Create new label"
        >
            <Plus size="25" />
        </button>
    {/if}
</div>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvdmFyaWFibGVzJzsKCiAgICAuc2VsZWN0LWxhYmVsIHsKICAgICAgICBkaXNwbGF5OiBmbGV4OwogICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7CiAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuOwogICAgICAgIGJhY2tncm91bmQtY29sb3I6IEBsaWdodC1hY2NlbnQ7CiAgICAgICAgYm9yZGVyLXJhZGl1czogQGJvcmRlci1yYWRpdXM7CiAgICAgICAgYm9yZGVyOiBub25lOwoKICAgICAgICAuaWNvbi1idXR0b24gewogICAgICAgICAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDsKICAgICAgICAgICAgcGFkZGluZzogMC4yZW07CiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IEBib3JkZXItcmFkaXVzOwogICAgICAgICAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDsKICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjsKICAgICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7CiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIEBsaWdodC1hY2NlbnQ7CgogICAgICAgICAgICAmOmhvdmVyIHsKICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IEBiZzsKICAgICAgICAgICAgfQogICAgICAgIH0KCiAgICAgICAgLnNlbGVjdC1idXR0b24gewogICAgICAgICAgICBkaXNwbGF5OiBpbmxpbmUtZ3JpZDsKICAgICAgICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAyMHB4IDNmcjsKICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjsKICAgICAgICAgICAgbWFyZ2luOiAwIDFlbTsKICAgICAgICAgICAganVzdGlmeS1pdGVtczogbGVmdDsKICAgICAgICB9CiAgICB9CgogICAgLmxhYmVsLWJ1dHRvbiB7CiAgICAgICAgaGVpZ2h0OiAyZW07CiAgICAgICAgd2lkdGg6IDEwMCU7CiAgICAgICAgcGFkZGluZzogMCAxZW07CiAgICAgICAgbWFyZ2luOiAwOwogICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjsKICAgICAgICBkaXNwbGF5OiBpbmxpbmUtZ3JpZDsKICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDFmciAzZnI7CiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7CiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjsKCiAgICAgICAgJjpob3ZlciB7CiAgICAgICAgICAgIGJhY2tncm91bmQ6IEBiZzsKICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogQGJvcmRlci1yYWRpdXM7CiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIEBib3JkZXI7CiAgICAgICAgfQoKICAgICAgICAmLnNpbmdsZSB7CiAgICAgICAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyOwogICAgICAgIH0KICAgIH0KCiAgICAubGlzdC1jb250YWluZXIgewogICAgICAgIG1heC1oZWlnaHQ6IDgwdmg7CiAgICAgICAgb3ZlcmZsb3cteTogYXV0bzsKICAgIH0K"></style>