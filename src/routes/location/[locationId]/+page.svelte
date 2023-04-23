<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgRWRpdExvY2F0aW9uIGZyb20gJy4uLy4uLy4uL2xpYi9jb21wb25lbnRzL0VkaXRMb2NhdGlvbi5zdmVsdGUnOwogICAgaW1wb3J0IEVudHJpZXMgZnJvbSAnLi4vLi4vLi4vbGliL2NvbXBvbmVudHMvRW50cmllcy5zdmVsdGUnOwogICAgaW1wb3J0IHR5cGUgeyBMb2NhdGlvbiB9IGZyb20gJy4uLy4uLy4uL2xpYi9jb250cm9sbGVycy9sb2NhdGlvbic7CgogICAgZXhwb3J0IGxldCBkYXRhOiBBcHAuUGFnZURhdGEgJiB7CiAgICAgICAgbG9jYXRpb246IExvY2F0aW9uOwogICAgfTsK">{}</script>

<section class="edit">
    <div>
        <EditLocation {...data.location} auth="{data}" />
    </div>
</section>

<section class="entries">
    <Entries
        auth="{data}"
        options="{{
            locationId: data.location.id
        }}"
        pageSize="{data.settings.entriesPerPage.value}"
        showLabels="{true}"
        showLocations="{false}"
        showSearch="{true}"
    />
</section>

<style lang="less" ✂prettier:content✂="CiAgICAuZW50cmllcyB7CiAgICAgICAgbWFyZ2luOiAxcmVtOwogICAgfQoKICAgIC5lZGl0IHsKICAgICAgICBtYXJnaW46IDJyZW07CiAgICB9Cg=="></style>