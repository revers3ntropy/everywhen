<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyB0b29sdGlwIH0gZnJvbSAnQHN2ZWx0ZS1wbHVnaW5zL3Rvb2x0aXBzJzsKICAgIGltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnOwogICAgaW1wb3J0IE1hcE1hcmtlciBmcm9tICdzdmVsdGUtbWF0ZXJpYWwtaWNvbnMvTWFwTWFya2VyT3V0bGluZS5zdmVsdGUnOwogICAgaW1wb3J0IHsgZ2V0Tm90aWZpY2F0aW9uc0NvbnRleHQgfSBmcm9tICdzdmVsdGUtbm90aWZpY2F0aW9ucyc7CiAgICBpbXBvcnQgdHlwZSB7IExvY2F0aW9uIH0gZnJvbSAnLi4vY29udHJvbGxlcnMvbG9jYXRpb24nOwogICAgaW1wb3J0IHR5cGUgeyBBdXRoIH0gZnJvbSAnLi4vY29udHJvbGxlcnMvdXNlcic7CiAgICBpbXBvcnQgeyBhcGkgfSBmcm9tICcuLi91dGlscy9hcGlSZXF1ZXN0JzsKICAgIGltcG9ydCB7IGRpc3BsYXlOb3RpZk9uRXJyIH0gZnJvbSAnLi4vdXRpbHMvbm90aWZpY2F0aW9ucyc7CiAgICBpbXBvcnQgeyBvYmZ1c2NhdGUgfSBmcm9tICcuLi91dGlscy90ZXh0JzsKICAgIGltcG9ydCBEb3QgZnJvbSAnLi9Eb3Quc3ZlbHRlJzsKCiAgICBjb25zdCBNQVhfTE9DQVRJT05TX1NIT1dOID0gMjsKCiAgICBleHBvcnQgY29uc3QgeyBhZGROb3RpZmljYXRpb24gfSA9IGdldE5vdGlmaWNhdGlvbnNDb250ZXh0KCk7CgogICAgZXhwb3J0IGxldCBhdXRoOiBBdXRoOwogICAgZXhwb3J0IGxldCBvYmZ1c2NhdGVkID0gZmFsc2U7CiAgICBleHBvcnQgbGV0IGVudHJ5SWQ6IHN0cmluZyB8IG51bGwgPSBudWxsOwogICAgZXhwb3J0IGxldCBsYXRpdHVkZTogbnVtYmVyOwogICAgZXhwb3J0IGxldCBsb25naXR1ZGU6IG51bWJlcjsKCiAgICBsZXQgbG9jYXRpb25zOiBMb2NhdGlvbltdOwogICAgbGV0IG5lYXJieSA9IG51bGwgYXMgTG9jYXRpb25bXSB8IG51bGw7CiAgICBsZXQgbG9hZGVkID0gZmFsc2U7CgogICAgYXN5bmMgZnVuY3Rpb24gbG9hZCAoKSB7CiAgICAgICAgY29uc3QgcmVzID0gZGlzcGxheU5vdGlmT25FcnIoCiAgICAgICAgICAgIGFkZE5vdGlmaWNhdGlvbiwKICAgICAgICAgICAgYXdhaXQgYXBpLmdldChhdXRoLCAnL2xvY2F0aW9ucycsIHsgbGF0OiBsYXRpdHVkZSwgbG9uOiBsb25naXR1ZGUgfSksCiAgICAgICAgKTsKICAgICAgICBsb2NhdGlvbnMgPSByZXMubG9jYXRpb25zOwogICAgICAgIG5lYXJieSA9ICduZWFyYnknIGluIHJlcyAmJiByZXMubmVhcmJ5ID8gcmVzLm5lYXJieSA6IG51bGw7CiAgICAgICAgbG9hZGVkID0gdHJ1ZTsKICAgIH0KCiAgICBvbk1vdW50KGxvYWQpOwoKICAgICQ6IGNvb3Jkc1Rvb2x0aXAgPSB7CiAgICAgICAgY29udGVudDogYENyZWF0ZWQgYXQgJHtsYXRpdHVkZX0sICR7bG9uZ2l0dWRlfSAobGF0LCBsbmcpYCwKICAgIH07Cg==">{}</script>

<span class="outer">
    {#if entryId}
        <a use:tooltip="{coordsTooltip}" href="/journal/{entryId}">
            <MapMarker size="20" />
        </a>
    {:else}
        <span use:tooltip="{coordsTooltip}">
            <MapMarker size="20" />
        </span>
    {/if}
    {#if loaded}
        {#if locations.length}
            <span class="multi-locations-container">
                {#each locations as location, i}
                    {#if i < MAX_LOCATIONS_SHOWN}
                        {#if obfuscated}
                            <span class="text-light obfuscated">
                                {obfuscate(location.name)}
                            </span>
                        {:else}
                            <a href="/location/{location.id}">
                                {location.name}
                            </a>
                        {/if}
                        {#if i < locations.length - 1}
                            <Dot />
                        {/if}
                    {:else if i === MAX_LOCATIONS_SHOWN}
                        <span
                            use:tooltip="{{
                                content: locations
                                    .slice(MAX_LOCATIONS_SHOWN)
                                    .map(l => l.name)
                                    .join(', ')
                            }}"
                        >
                            ...
                        </span>
                    {/if}
                {/each}
            </span>
        {:else if nearby && nearby?.length}
            <span class="flex-center" style="gap: 0.2rem">
                <span class="text-light">near</span>
                <a href="/location/{nearby[0].id}">
                    {nearby[0].name}
                </a>
            </span>
        {/if}
    {:else}
        ...
    {/if}
</span>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvdmFyaWFibGVzJzsKCiAgICAub3V0ZXIgewogICAgICAgIGRpc3BsYXk6IGZsZXg7CiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7CiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjsKCiAgICAgICAgZm9udC1zaXplOiAwLjlyZW07CiAgICAgICAgY29sb3I6IEB0ZXh0LWNvbG9yLWxpZ2h0OwoKICAgICAgICAubXVsdGktbG9jYXRpb25zLWNvbnRhaW5lciB7CiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7CiAgICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyOwogICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyOwogICAgICAgIH0KICAgIH0K"></style>