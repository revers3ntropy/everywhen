<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgTWVudURvd24gZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL01lbnVEb3duLnN2ZWx0ZSc7CiAgICBpbXBvcnQgTWVudVVwIGZyb20gJ3N2ZWx0ZS1tYXRlcmlhbC1pY29ucy9NZW51VXAuc3ZlbHRlJzsKICAgIGltcG9ydCBEcm9wZG93biBmcm9tICcuLi8uLi9saWIvY29tcG9uZW50cy9Ecm9wZG93bi5zdmVsdGUnOwoKICAgIGV4cG9ydCBsZXQgb3B0aW9uczogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyPjsKICAgIGV4cG9ydCBsZXQga2V5OiBzdHJpbmc7CiAgICBleHBvcnQgbGV0IG9wZW4gPSBmYWxzZTsKCiAgICBleHBvcnQgbGV0IHZhbHVlID0gbnVsbDsKICAgICQ6IHZhbHVlID0gb3B0aW9uc1trZXldOwoKICAgICQ6IGlmICghKGtleSBpbiBvcHRpb25zKSkga2V5ID0gT2JqZWN0LmtleXMob3B0aW9ucylbMF07CgogICAgbGV0IGNsb3NlOiAoKSA9PiB2b2lkOwo=">{}</script>

<Dropdown bind:close="{close}" bind:open="{open}" unstyledButton>
    <span class="selector" slot="button">
        {key}
        {#if open}
            <MenuUp />
        {:else}
            <MenuDown />
        {/if}
    </span>

    <div class="options">
        {#each Object.keys(options) as option}
            <button
                on:click="{() => {
                    close();
                    key = option;
                }}"
            >
                {option}
            </button>
        {/each}
    </div>
</Dropdown>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvdmFyaWFibGVzJzsKICAgIEBpbXBvcnQgJy4uLy4uL3N0eWxlcy9sYXlvdXQnOwoKICAgIGJ1dHRvbiB7CiAgICAgICAgZGlzcGxheTogYmxvY2s7CiAgICAgICAgcGFkZGluZzogMC4zZW07CiAgICAgICAgYm9yZGVyLXJhZGl1czogQGJvcmRlci1yYWRpdXM7CiAgICAgICAgYm9yZGVyOiBub25lOwoKICAgICAgICAmOmhvdmVyIHsKICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogQGFjY2VudC1jb2xvci1wcmltYXJ5OwogICAgICAgICAgICBjb2xvcjogYmxhY2s7CiAgICAgICAgfQogICAgfQoKICAgIC5vcHRpb25zIHsKICAgICAgICBkaXNwbGF5OiBmbGV4OwogICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47CiAgICAgICAgcGFkZGluZzogMDsKICAgICAgICBib3JkZXI6IDFweCBzb2xpZCBAYm9yZGVyLWhlYXZ5OwogICAgICAgIGJvcmRlci10b3AtY29sb3I6IEBib3JkZXItbGlnaHQ7CiAgICAgICAgYm9yZGVyLXJhZGl1czogQGJvcmRlci1yYWRpdXM7CiAgICAgICAgYmFja2dyb3VuZDogQGxpZ2h0LWFjY2VudDsKCiAgICAgICAgYnV0dG9uIHsKICAgICAgICAgICAgcGFkZGluZzogMC40cmVtIDEuMnJlbTsKICAgICAgICB9CiAgICB9CgogICAgLnNlbGVjdG9yIHsKICAgICAgICAmOmV4dGVuZChidXR0b24ucHJpbWFyeSk7CiAgICAgICAgY3Vyc29yOiBwb2ludGVyOwogICAgICAgIG1hcmdpbjogMC41ZW07CiAgICB9Cg=="></style>