<script lang="ts">
    import { Auth } from '$lib/controllers/auth/auth';
    import { Backup } from '$lib/controllers/backup/backup';
    import Download from 'svelte-material-icons/Download.svelte';
    import DownloadLock from 'svelte-material-icons/DownloadLock.svelte';
    import Upload from 'svelte-material-icons/Upload.svelte';
    import { api } from '../utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { showPopup } from '../utils/popups';
    import type { Result } from '../utils/result';
    import FileDropDialog from '$lib/components/dialogs/FileDropDialog.svelte';
    import { encryptionKey, username } from '$lib/stores';

    let downloading = false;

    async function download(encrypted: boolean) {
        if (downloading) return;
        downloading = true;
        const { data: backupData } = notify.onErr(await api.get('/backups', { encrypted }));
        Backup.download(backupData, $username, encrypted);
        downloading = false;
    }

    const confirmRestoreMessage =
        'Are you sure you want to restore from this backup?' +
        ' This will overwrite all your existing data.';

    function upload() {
        showPopup(FileDropDialog, {
            message: 'Drop .json file here',
            showTextBox: true,
            textBoxType: 'password',
            textBoxLabel:
                'Password of account the backup came from ' + '(leave blank if same account)',
            withContents: async (res: Result<string>, password?: string) => {
                let contents = notify.onErr(res);

                if (!confirm(confirmRestoreMessage)) return;

                let key: string;
                if (!password) {
                    if ($encryptionKey) {
                        key = $encryptionKey;
                    } else {
                        notify.error('No encryption key found');
                        return;
                    }
                } else {
                    key = Auth.encryptionKeyFromPassword(password);
                }

                notify.onErr(
                    await api.post('/backups', {
                        data: contents,
                        key: key
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
