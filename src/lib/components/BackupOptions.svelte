<script lang="ts">
    import Download from 'svelte-material-icons/Download.svelte';
    import DownloadLock from 'svelte-material-icons/DownloadLock.svelte';
    import Upload from 'svelte-material-icons/Upload.svelte';
    import { Backup } from '../controllers/backup';
    import type { Auth } from '../controllers/user';
    import { encryptionKeyFromPassword } from '../security/authUtils';
    import { api } from '../utils/apiRequest';
    import {
        displayNotifOnErr,
        notify
    } from '$lib/components/notifications/notifications';
    import { showPopup } from '../utils/popups';
    import type { Result } from '../utils/result';
    import FileDropDialog from '$lib/components/dialogs/FileDropDialog.svelte';

    export let auth: Auth;

    let downloading = false;

    async function download(encrypted: boolean) {
        if (downloading) return;
        downloading = true;
        const { data: backupData } = displayNotifOnErr(
            await api.get(auth, '/backups', { encrypted })
        );
        Backup.download(backupData, auth.username, encrypted);
        downloading = false;
    }

    function upload() {
        showPopup(FileDropDialog, {
            auth,
            message: 'Drop .json file here',
            showTextBox: true,
            textBoxType: 'password',
            textBoxLabel:
                'Password of account the backup came from ' +
                '(leave blank if same account)',
            withContents: async (res: Result<string>, password?: string) => {
                let contents = displayNotifOnErr(res);

                if (
                    !confirm(
                        'Are you sure you want to restore from this backup?' +
                            ' This will overwrite all your existing data.'
                    )
                ) {
                    return;
                }

                if (!password) {
                    password = auth.key;
                } else {
                    password = encryptionKeyFromPassword(password);
                }

                displayNotifOnErr(
                    await api.post(auth, '/backups', {
                        data: contents,
                        key: password
                    })
                );
                notify.success('File uploaded successfully');
            }
        });
    }
</script>

<button disabled={downloading} on:click={() => download(true)}>
    <DownloadLock size="30" />
    Download Backup
</button>
<button disabled={downloading} on:click={() => download(false)}>
    <Download size="30" />
    Download Unencrypted Backup
</button>
<button disabled={downloading} on:click={upload}>
    <Upload size="30" />
    Restore from Backup
</button>
