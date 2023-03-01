<script lang="ts">
    import { api } from '../../lib/api/apiQuery';
    import LabelSelect from '../../lib/components/LabelSelect.svelte';
    import { popup } from '../../lib/constants';
    import { User } from '../../lib/controllers/user';

    export let auth: User;
    export let id: string;
    export let colour: string;
    export let name: string;

    let entries = [];
    $: api.get(auth, `/entries?labelId=${id}`)
          .then((data) => {
              entries = data.entries;
          })
          .catch(console.trace);
    let changeLabelId;

    async function delAndEntries () {
        await Promise.all(entries.map(entry => {
            api.delete(auth, `/entries/${entry.id}`);
        }));
        await api.delete(auth, `/labels/${id}`);
        popup.set(null);
    }

    async function delAndRmLabel () {
        await Promise.all(entries.map(entry => {
            api.put(auth, `/entries/${entry.id}`, {
                label: null,
            });
        }));
        await api.delete(auth, `/labels/${id}`);
        popup.set(null);
    }

    async function delAndReassign () {
        await Promise.all(entries.map(entry => {
            api.put(auth, `/entries/${entry.id}`, {
                label: changeLabelId,
            });
        }));
        await api.delete(auth, `/labels/${id}`);
        popup.set(null);
    }

    function cancel () {
        popup.set(null);
    }
</script>

<div>
    <h1>Delete Label '{name}'</h1>
    <p>There are {entries.length} entries with this label.</p>

    <div class="options">
        <div>
            <button on:click={delAndRmLabel}>
                Remove Label from Entries with this Label
            </button>
        </div>
        <div>
            <button on:click={delAndEntries}>
                Delete Entries with this Label
            </button>
        </div>
        <div>
            <button on:click={delAndReassign}>
                Give Different Label to Entries with this Label
            </button>
            <LabelSelect
                {auth}
                bind:value={changeLabelId}
                filter={(label) => label.id !== id}
            />
        </div>
        <div class="cancel">
            <button on:click|self={cancel}>
                Cancel
            </button>
        </div>
    </div>
</div>

<style lang="less">
    @import '../../styles/variables.less';

    .options {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 2rem;

        & > div {
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid @border;
            border-radius: 10px;
            padding: 0.6em;
            margin: 0.5em;

            &:hover {
                background: @accent-color-danger;
            }

            &.cancel {
                border: none;

                &:hover {
                    background: @accent-color-primary;
                }
            }
        }
    }

    button {
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>