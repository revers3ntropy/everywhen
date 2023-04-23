<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyB0b29sdGlwIH0gZnJvbSAnQHN2ZWx0ZS1wbHVnaW5zL3Rvb2x0aXBzJzsKICAgIGltcG9ydCAqIGFzIHRpbWVhZ28gZnJvbSAndGltZWFnby5qcyc7CiAgICBpbXBvcnQgeyBudW1iZXJBc1NpZ25lZFN0ciB9IGZyb20gJy4uL3V0aWxzL3RleHQnOwogICAgaW1wb3J0IHsgY3VycmVudFR6T2Zmc2V0LCBmbXRVdGMgfSBmcm9tICcuLi91dGlscy90aW1lJzsKICAgIGltcG9ydCB0eXBlIHsgSG91cnMsIFNlY29uZHMgfSBmcm9tICcuLi91dGlscy90eXBlcyc7CgogICAgZXhwb3J0IGxldCB0aW1lc3RhbXA6IFNlY29uZHM7CiAgICBleHBvcnQgbGV0IHR6T2Zmc2V0OiBIb3VycyA9IGN1cnJlbnRUek9mZnNldCgpOwogICAgZXhwb3J0IGxldCBmbXQgPSAnaDptbSBBJzsKICAgIGV4cG9ydCBsZXQgcmVsYXRpdmUgPSBmYWxzZTsKICAgIGV4cG9ydCBsZXQgbm9Ub29sdGlwID0gZmFsc2U7CiAgICBleHBvcnQgbGV0IHRvb2x0aXBQb3NpdGlvbiA9ICd0b3AnOwo=">{}</script>

{#if !noTooltip}
    <span
        use:tooltip="{{
            content:
                `UTC ${fmtUtc(timestamp, 0, 'hh:mma')}` +
                ` (${numberAsSignedStr(tzOffset)}h)` +
                `<p>${fmtUtc(
                    timestamp,
                    currentTzOffset(),
                    'hh:mma'
                )} local time</p>`,
            autoPosition: true,
            position: tooltipPosition
        }}"
    >
        {#if relative}
            {timeago.format(timestamp * 1000)}
        {:else}
            {fmtUtc(timestamp, tzOffset, fmt)}
        {/if}
    </span>
{:else}
    <span>
        {#if relative}
            {timeago.format(timestamp * 1000)}
        {:else}
            {fmtUtc(timestamp, tzOffset, fmt)}
        {/if}
    </span>
{/if}

<style lang="less" ✂prettier:content✂="CiAgICAqIHsKICAgICAgICBjb2xvcjogaW5oZXJpdDsKICAgICAgICBmb250LXN0eWxlOiBpbmhlcml0OwogICAgICAgIGZvbnQtc2l6ZTogaW5oZXJpdDsKCiAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDsKICAgIH0K"></style>