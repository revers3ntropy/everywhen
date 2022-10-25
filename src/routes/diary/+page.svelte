<script lang="ts">

</script>

<main>
    <form>
        <input type="hidden" value="add" name="action"/>

        <label for="input-t"></label>
        <input name="t" id="input-t" placeholder="Title"/>
        <label for="input-types"></label>
        <input name="types" id="input-types" placeholder="tags"/>
        <span>
                <button type="submit" id="submit" class="icon" style="transform: translate(10px, 10px)">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px">
                        <path d="M0 0h24v24H0V0z" fill="none"/>
                        <path d="M4.01 6.03l7.51 3.22-7.52-1 .01-2.22m7.5 8.72L4 17.97v-2.22l7.51-1M2.01 3L2 10l15 2-15 2 .01 7L23 12 2.01 3z"/>
                    </svg>
                </button>
            </span>
        <br>
        <label for="input-e"></label>
        <textarea name="e" id="input-e" placeholder="Entry"></textarea>
    </form>
</main>

<style lang="less">

</style>
