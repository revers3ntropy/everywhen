<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgQ2hldnJvbkRvd24gZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL0NoZXZyb25Eb3duLnN2ZWx0ZSc7CiAgICBpbXBvcnQgQ2hldnJvblVwIGZyb20gJ3N2ZWx0ZS1tYXRlcmlhbC1pY29ucy9DaGV2cm9uVXAuc3ZlbHRlJzsKICAgIGltcG9ydCBFbnRyeSBmcm9tICcuLi8uLi9saWIvY29tcG9uZW50cy9FbnRyeS5zdmVsdGUnOwogICAgaW1wb3J0IHR5cGUgeyBFbnRyeSBhcyBFbnRyeUNvbnRyb2xsZXIgfSBmcm9tICcuLi8uLi9saWIvY29udHJvbGxlcnMvZW50cnknOwogICAgaW1wb3J0IHR5cGUgeyBBdXRoIH0gZnJvbSAnLi4vY29udHJvbGxlcnMvdXNlcic7CiAgICBpbXBvcnQgeyBub3dTLCB1dGNFcSB9IGZyb20gJy4uL3V0aWxzL3RpbWUnOwogICAgaW1wb3J0IERvdCBmcm9tICcuL0RvdC5zdmVsdGUnOwogICAgaW1wb3J0IFV0Y1RpbWUgZnJvbSAnLi9VdGNUaW1lLnN2ZWx0ZSc7CgogICAgZXhwb3J0IGxldCBvYmZ1c2NhdGVkID0gdHJ1ZTsKICAgIGV4cG9ydCBsZXQgZW50cmllczogRW50cnlDb250cm9sbGVyW107CiAgICBleHBvcnQgbGV0IHNob3dMYWJlbHMgPSB0cnVlOwogICAgZXhwb3J0IGxldCBzaG93TG9jYXRpb25zID0gdHJ1ZTsKICAgIGV4cG9ydCBsZXQgYXV0aDogQXV0aDsKICAgIGV4cG9ydCBsZXQgZGF5OiBudW1iZXI7CgogICAgbGV0IGNvbGxhcHNlZCA9IGZhbHNlOwoKICAgIGZ1bmN0aW9uIHRvZ2dsZUNvbGxhcHNlICgpIHsKICAgICAgICBjb2xsYXBzZWQgPSAhY29sbGFwc2VkOwogICAgfQo=">{}</script>

<div class="entry-group container">
    <div class="title">
        <div>
            <h3>
                <button
                    class="flex-center not-link"
                    on:click="{toggleCollapse}"
                >
                    {#if collapsed}
                        <ChevronDown size="30" />
                    {:else}
                        <ChevronUp size="30" />
                    {/if}

                    <UtcTime
                        fmt="ddd, Do MMMM YYYY"
                        noTooltip
                        timestamp="{day}"
                    />

                    {#if collapsed}
                        <p class="entry-count">
                            <Dot />
                            {entries.length}
                            {entries.length === 1 ? 'entry' : 'entries'}
                        </p>
                    {/if}
                </button>
            </h3>
        </div>
        <div>
            <p class="text-light">
                {#if utcEq(nowS(), day)}
                    <span>Today</span>
                {:else if utcEq(nowS() - 60 * 60 * 24, day)}
                    <span>Yesterday</span>
                {:else}
                    <UtcTime relative timestamp="{day}" />
                {/if}
            </p>
        </div>
    </div>
    {#if !collapsed}
        <div class="contents">
            {#each entries as entry}
                <Entry
                    {...entry}
                    on:updated
                    obfuscated="{obfuscated}"
                    showLabels="{showLabels}"
                    showLocations="{showLocations}"
                    auth="{auth}"
                />
            {/each}
        </div>
    {/if}
</div>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvdmFyaWFibGVzJzsKCiAgICAuZW50cnktZ3JvdXAgewogICAgICAgIG1hcmdpbjogMWVtIDA7CiAgICAgICAgcGFkZGluZzogMDsKCiAgICAgICAgLnRpdGxlIHsKICAgICAgICAgICAgZGlzcGxheTogZmxleDsKICAgICAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuOwogICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyOwogICAgICAgICAgICBwYWRkaW5nOiAwIDFyZW0gMCAwLjVyZW07CgogICAgICAgICAgICAuZW50cnktY291bnQgewogICAgICAgICAgICAgICAgbWFyZ2luOiAwIDAgMCAwLjRlbTsKICAgICAgICAgICAgICAgIHBhZGRpbmc6IDA7CgogICAgICAgICAgICAgICAgJiwKICAgICAgICAgICAgICAgICYgKiB7CiAgICAgICAgICAgICAgICAgICAgY29sb3I6IEB0ZXh0LWNvbG9yLWxpZ2h0OwogICAgICAgICAgICAgICAgfQoKICAgICAgICAgICAgICAgIEBtZWRpYSBAbW9iaWxlIHsKICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBub25lOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CgogICAgICAgICAgICBAbWVkaWEgQG1vYmlsZSB7CiAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiBAYm9yZGVyLXJhZGl1czsKICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IEBsaWdodC12LWFjY2VudDsKICAgICAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIEBib3JkZXI7CiAgICAgICAgICAgICAgICBtYXJnaW46IDAuNXJlbSAwOwogICAgICAgICAgICAgICAgcGFkZGluZzogMC40cmVtIDAuOHJlbSAwLjRyZW0gMDsKICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBzdGlja3k7CiAgICAgICAgICAgICAgICB0b3A6IDAuM2VtOwogICAgICAgICAgICAgICAgei1pbmRleDogNDsKCiAgICAgICAgICAgICAgICBwLAogICAgICAgICAgICAgICAgaDMgewogICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMDsKICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAwOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CiAgICAgICAgfQoKICAgICAgICBAbWVkaWEgQG1vYmlsZSB7CiAgICAgICAgICAgIG1hcmdpbjogMDsKICAgICAgICAgICAgYm9yZGVyOiBub25lOwogICAgICAgICAgICBib3JkZXItcmFkaXVzOiAwOwogICAgICAgIH0KCiAgICAgICAgLmNvbnRlbnRzIHsKICAgICAgICAgICAgcGFkZGluZzogMCAwIDFlbSAwOwogICAgICAgIH0KICAgIH0K"></style>