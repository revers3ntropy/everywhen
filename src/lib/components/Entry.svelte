<script lang="ts">
    export let id;
    export let title;
    export let entry;
    export let created;
    export let label = null;
    export let latitude;
    export let longitude;
    export let deleted;
</script>
<div class="entry">
    <h3>{title}</h3>
    {@html entry}
</div>
<style lang="less">
    @import '../../styles/variables.less';

    .entry {
        padding: 1em;
        border-radius: 3px;
        margin: 1em 0;
        height: fit-content;
        border-bottom: 1px solid @border;
    }

    h3 {
        border-bottom: 1px solid @border-light;
    }
</style>