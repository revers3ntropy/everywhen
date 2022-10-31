<script lang="ts">
    import { type FileDropOptions, filedrop } from "filedrop-svelte";
    import { getFileContents } from "$lib/utils";
    import { getNotificationsContext } from "svelte-notifications";
    import type { Entry, Label } from "$lib/types";
    import { onMount } from "svelte";
    import { api } from "$lib/api/apiQuery";
    import { popup } from "../../lib/constants";
    const { addNotification } = getNotificationsContext();

    export let auth;

    const fileOptions: FileDropOptions = {
        fileLimit: 1,
        windowDrop: false
    };

    let labels;
    onMount(async () => {
        const res = await api.get(auth, `/labels`);
        labels = res.labels;
    });

    async function entries (e: CustomEvent): Promise<void> {
        if (!labels) {
            popup.set(null);
            return void addNotification({
                text: `Failed to load labels`,
                position: 'top-center',
                type: 'error',
                removeAfter: 4000
            });
        }

        const labelHashMap = new Map<string, string>();
        labels.forEach((label) => {
            labelHashMap.set(label.name, label.id);
        });

        const file: File | undefined = e.detail?.files?.accepted?.[0];
        if (!file) {
            popup.set(null);
            return void addNotification({
                text: `Failed to load file`,
                position: 'top-center',
                type: 'error',
                removeAfter: 4000
            });
        }
        const contents = await getFileContents(file)
            .catch(e => {
                addNotification({
                    text: `Failed to load file: ${e.toString()}`,
                    position: 'top-center',
                    type: 'error',
                    removeAfter: 4000
                });
            });

        if (!contents) return;
        let json: unknown = [];

        try {
            json = JSON.parse(contents) as unknown;
        } catch (e) {
            popup.set(null);
            return void addNotification({
                text: `Failed to parse JSON file: ${e.toString()}`,
                position: 'top-center',
                type: 'error',
                removeAfter: 4000
            });
        }

        if (!Array.isArray(json)) {
            popup.set(null);
            return void addNotification({
                text: `Incorrect JSON structure, expected array`,
                position: 'top-center',
                type: 'error',
                removeAfter: 4000
            });
        }

        let errors: [number, string][] = [];

        let i = -1;
        for (let entryJSON of json) {
            i++;
            if (typeof entryJSON !== 'object' || Array.isArray(entryJSON)) {
                errors.push([i, `entry is not object`])
                continue;
            }

            const postBody: Partial<Entry> = {};

            postBody.entry = entryJSON.entry;
            postBody.title = entryJSON.title || '';
            postBody.created = parseInt(entryJSON.time) || entryJSON.created;
            postBody.latitude = parseFloat(entryJSON.latitude || entryJSON.location[0]) || 0;
            postBody.longitude = parseFloat(entryJSON.longitude || entryJSON.location[1]) || 0;

            if (entryJSON.types && entryJSON.types.length) {
                const name = entryJSON.types[0] as string;
                if (!labelHashMap.has(name)) {
                    addNotification({
                        text: `Creating label ${name}`,
                        position: 'top-center',
                        type: 'info',
                        removeAfter: 10000
                    });
                    const createLabelRes = await api.post(auth, `/labels`, {
                        name,
                        colour: 'black'
                    });

                    if (typeof createLabelRes.id !== 'string') {
                        errors.push([i, `failed to create label ${name}`]);
                        continue;
                    }

                    postBody.label = createLabelRes.id;
                    labelHashMap.set(name, createLabelRes.id);
                } else {
                    postBody.label = labelHashMap.get(name) as Label;
                }
            }
            postBody.label ||= entryJSON.label as Label;

            const res = await api.post(auth, `/entries`, postBody);
            if (res.erroneous) {
                errors.push(res.body?.message);
            }
        }

        if (errors.length < 0) {
            popup.set(null);
            return void addNotification({
                text: `Successfully uploaded entries`,
                position: 'top-center',
                type: 'success',
                removeAfter: 4000
            });
        }

        for (let error of errors) {
            const text = '#' + error[0] + ': ' + error[1];
            console.error(text);
            addNotification({
                text,
                position: 'top-center',
                type: 'error',
                removeAfter: 4000
            });
        }
        popup.set(null);
    }
</script>

<div use:filedrop={fileOptions} on:filedrop={entries} class="dropzone">
    Import Entries from .json file
</div>