<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJzsKICAgIGltcG9ydCB0eXBlIHsgQXBwIH0gZnJvbSAnLi4vLi4vLi4vYXBwJzsKICAgIGltcG9ydCBFbnRyeSBmcm9tICcuLi8uLi8uLi9saWIvY29tcG9uZW50cy9FbnRyeS5zdmVsdGUnOwogICAgaW1wb3J0IHR5cGUgeyBFbnRyeSBhcyBFbnRyeUNvbnRyb2xsZXIgfSBmcm9tICcuLi8uLi8uLi9saWIvY29udHJvbGxlcnMvZW50cnknOwogICAgaW1wb3J0IHsgb2JmdXNjYXRlZCB9IGZyb20gJy4uLy4uLy4uL2xpYi9zdG9yZXMnOwoKICAgIGV4cG9ydCBsZXQgZGF0YTogQXBwLlBhZ2VEYXRhICYgewogICAgICAgIGVudHJ5OiBFbnRyeUNvbnRyb2xsZXI7CiAgICAgICAgaGlzdG9yeTogYm9vbGVhbjsKICAgIH07CgogICAgb25Nb3VudCgoKSA9PiAoZG9jdW1lbnQudGl0bGUgPSBgVmlldyBFbnRyeWApKTsK">{}</script>

<svelte:head>
    <title>View Entry</title>
    <meta content="View Entry" name="description" />
</svelte:head>

<main>
    {#if data.entry.deleted}
        <i>This entry has been deleted. </i>
    {:else if data.history}
        <i>Current Version</i>
    {/if}

    <Entry
        {...data.entry}
        auth="{data}"
        obfuscated="{$obfuscated}"
        on:updated="{() => location.reload()}"
        showFullDate="{true}"
    />

    {#if !data.history}
        {#if data.entry.edits?.length}
            <div class="flex-center">
                <a href="/journal/{data.entry.id}?history=on&obfuscate=0">
                    Show History ({data.entry.edits?.length} edits)
                </a>
            </div>
        {/if}
    {:else}
        <div class="flex-center">
            <a href="/journal/{data.entry.id}?obfuscate=0">
                Hide History ({data.entry.edits?.length} edits)
            </a>
        </div>
        {#if !data.entry.edits?.length}
            <div class="flex-center">No edits have been made to this entry</div>
        {:else}
            <i>Older Versions</i>
            {#each (data.entry.edits || []).sort((a, b) => b.created - a.created) as edit}
                <Entry
                    {...edit}
                    auth="{data}"
                    obfuscated="{$obfuscated}"
                    isEdit="{true}"
                    showFullDate="{true}"
                />
            {/each}
        {/if}
    {/if}
</main>