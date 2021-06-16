import { EncryptionKey } from '@meeco/cryppo';
import { Environment, ItemService, ItemUpdate, SymmetricKey } from '@meeco/sdk';
import {
  downloadThumbnail,
  encryptAndUploadThumbnail,
  fileDownloadBrowserWithCancel,
  fileUploadBrowserWithCancel,
  ThumbnailType,
  ThumbnailTypes,
  thumbSizeTypeToMimeExt,
} from '../src/index';
import './styles.scss';

const $ = id => document.getElementById(id)!;
const $get = (id: string) => ($(id) as HTMLInputElement)?.value;
const $set = (id: string, value: string) => (($(id) as HTMLInputElement).value = value);

// let environment;

loadEnvironmentFromStorage();

function loadEnvironmentFromStorage() {
  const loadKey = (key: string) =>
    localStorage.getItem(key) ? $set(key, localStorage.getItem(key)!) : void 0;

  loadKey('vaultUrl');
  loadKey('dataEncryptionKey');
  loadKey('keyEncryptionKey');
  loadKey('subscriptionKey');
  loadKey('vaultAccessToken');
  loadKey('oidcAccessToken');

  updateEnvironment();
}

function updateEnvironment() {
  const vaultUrl = $get('vaultUrl');
  const dataEncryptionKey = $get('dataEncryptionKey');
  const subscriptionKey = $get('subscriptionKey');
  const vaultAccessToken = $get('vaultAccessToken');
  const keyEncryptionKey = $get('keyEncryptionKey') || '';
  const oidcAccessToken = $get('oidcAccessToken');

  localStorage.setItem('vaultUrl', vaultUrl);
  localStorage.setItem('dataEncryptionKey', dataEncryptionKey);
  localStorage.setItem('subscriptionKey', subscriptionKey);
  localStorage.setItem('vaultAccessToken', vaultAccessToken);
  localStorage.setItem('keyEncryptionKey', keyEncryptionKey);
  localStorage.setItem('oidcAccessToken', oidcAccessToken);

  if (!vaultUrl || !dataEncryptionKey) {
    return $set('environmentStatus', 'Error: Please configure all environment fields');
  }

  $set('environmentStatus', 'Saved');
}
$('fileUploadProgressBar').hidden = true;
$('cancelAttachFile').hidden = true;
$('attachFile').addEventListener('click', attachFile, false);
$('cancelDownloadAttachment').hidden = true;
$('downloadAttachment').addEventListener('click', downloadAttachment);
// The "Save" button
$('updateEnvironment').addEventListener('click', updateEnvironment);
$('attachThumbnail').addEventListener('click', attachThumbnail);
$('thumbnailDownload').addEventListener('click', thumbnailDownload);

async function attachFile() {
  const [file] = ($('attachment') as any).files;
  const videoCodec = $get('videoCodec') || undefined;
  const label = $get('attachmentSlotLabel') || 'attachment';
  if (!file) {
    return alert('Please attach file first');
  }
  const itemId = $get('itemId');
  if (!itemId) {
    return alert('Please enter an item id');
  }
  $set('attached', '');
  try {
    const privateDek = SymmetricKey.fromSerialized(localStorage.getItem('dataEncryptionKey') || '');
    const vaultUrl = localStorage.getItem('vaultUrl') || '';
    const vaultAccessToken = localStorage.getItem('vaultAccessToken') || '';
    const oidcAccessToken = localStorage.getItem('oidcAccessToken') || '';
    const subscriptionKey = localStorage.getItem('subscriptionKey') || '';

    const keyEncryptionKey = SymmetricKey.fromSerialized(
      localStorage.getItem('keyEncryptionKey') || ''
    );
    const keystoreAccessToken = localStorage.getItem('keystoreAccessToken') || '';
    $('fileUploadProgressBar').hidden = false;
    $('cancelAttachFile').hidden = false;

    const progressUpdateFunc = (chunkBuffer: ArrayBuffer | null, percentageComplete: number) => {
      $set('fileUploadProgressBar', percentageComplete.toString());
    };

    const environment = new Environment({
      vault: {
        url: vaultUrl,
        subscription_key: subscriptionKey,
      },
      keystore: {
        url: '',
        subscription_key: subscriptionKey,
        provider_api_key: '',
      },
    });

    // itemService now accepts authdata, as user could fetch shared item and not its own item through this endpoint.
    // therefore it requires additional information about auth
    const itemService = new ItemService(environment);
    const itemFetchResult = await itemService.get(
      {
        data_encryption_key: privateDek,
        vault_access_token: vaultAccessToken,
        oidc_token: oidcAccessToken,
        key_encryption_key: keyEncryptionKey,
        keystore_access_token: keystoreAccessToken,
      },
      itemId
    );

    const { cancel, success } = fileUploadBrowserWithCancel({
      file,
      vaultUrl,
      authConfig: {
        vault_access_token: vaultAccessToken,
        oidc_token: oidcAccessToken,
        subscription_key: subscriptionKey,
      },
      videoCodec,
      progressUpdateFunc,
    });

    $('cancelAttachFile').addEventListener(
      'click',
      () => {
        cancel();
      },
      false
    );

    const { attachment: attachment, dek: attachmentDek }: any = await success
      .then(
        value => {
          return value;
        },
        reason => {
          alert(reason);
        }
      )
      .finally(() => {
        $('cancelAttachFile').hidden = true;
        $set('fileUploadProgressBar', '0');
      });

    const existingItem = itemFetchResult.item;
    const itemUpdateData = new ItemUpdate(existingItem.id, {
      slots: [
        {
          label,
          slot_type_name: 'attachment',
          attachment_id: attachment.id,
          value: attachmentDek.serialize,
        },
      ],
      label: existingItem.label,
    });

    const updated = await itemService.update(
      {
        vault_access_token: vaultAccessToken,
        oidc_token: oidcAccessToken,
        data_encryption_key: privateDek,
      },
      itemUpdateData
    );
    const slotId = updated.slots.find(slot => slot.attachment_id === attachment.id)?.id;
    $set('attached', JSON.stringify({ itemId, slotId, attachment }, null, 2));
  } catch (error) {
    $set('attached', `Error (See Action Log for Details)`);
    return handleException(error);
  }
}

async function downloadAttachment() {
  const itemId = $get('downloadItemId');
  const slotId = $get('downloadSlotId');

  $set('downloadAttachmentDetails', '');
  const videoPlayer = document.querySelector('video');
  let mediaSource: MediaSource;
  let sourceBuffer: SourceBuffer;

  try {
    const dek = SymmetricKey.fromSerialized(localStorage.getItem('dataEncryptionKey') || '');
    const vaultUrl = localStorage.getItem('vaultUrl') || '';
    const vaultAccessToken = localStorage.getItem('vaultAccessToken') || '';
    const oidcAccessToken = localStorage.getItem('oidcAccessToken') || '';
    const subscriptionKey = localStorage.getItem('subscriptionKey') || '';

    const keyEncryptionKey = SymmetricKey.fromSerialized(
      localStorage.getItem('keyEncryptionKey') || ''
    );
    const keystoreAccessToken = localStorage.getItem('keystoreAccessToken') || '';

    $('cancelDownloadAttachment').hidden = false;

    let isSteamingMedia = false;
    const progressUpdateFunc = (
      chunkBuffer: ArrayBuffer | null,
      percentageComplete: number,
      videoCodec?: string
    ) => {
      $set('fileDownloadProgressBar', percentageComplete.toString());
      if (videoCodec && chunkBuffer && videoPlayer) {
        if (!isSteamingMedia) {
          isSteamingMedia = true;
          mediaSource = new MediaSource();
          mediaSource.addEventListener(
            'sourceopen',
            async () => {
              if (!sourceBuffer) {
                sourceBuffer = mediaSource.addSourceBuffer(videoCodec);
              }
              if (chunkBuffer) {
                sourceBuffer.appendBuffer(chunkBuffer);
                if (videoPlayer.paused) {
                  videoPlayer
                    .play()
                    .then(() => {})
                    .catch(e => {
                      console.log(e);
                    });
                }
              }
            },
            false
          );
          videoPlayer.src = window.URL.createObjectURL(mediaSource);
        } else {
          if (!sourceBuffer.updating) {
            sourceBuffer.appendBuffer(chunkBuffer);
          } else {
            sourceBuffer.addEventListener('updateend', () => {
              sourceBuffer.appendBuffer(chunkBuffer);
            });
          }
        }
      }
    };

    const environment = new Environment({
      vault: {
        url: vaultUrl,
        subscription_key: subscriptionKey,
      },
      keystore: {
        url: '',
        subscription_key: subscriptionKey,
        provider_api_key: '',
      },
    });

    // itemService now accepts authdata, as user could fetch shared item and not its own item through this endpoint.
    // therefore it requires additional information about auth
    const itemService = new ItemService(environment);
    const itemFetchResult: any = await itemService.get(
      {
        data_encryption_key: dek,
        vault_access_token: vaultAccessToken,
        oidc_token: oidcAccessToken,
        key_encryption_key: keyEncryptionKey,
        keystore_access_token: keystoreAccessToken,
      },
      itemId
    );
    const attachmentSlot = itemFetchResult.slots.find(slot => slot.id === slotId);

    log('Downloading attachment');
    const { cancel, success } = fileDownloadBrowserWithCancel({
      attachmentId: attachmentSlot?.attachment_id,
      dek: EncryptionKey.fromSerialized(attachmentSlot?.value),
      vaultUrl,
      authConfig: {
        vault_access_token: vaultAccessToken,
        oidc_token: oidcAccessToken,
        subscription_key: subscriptionKey,
      },
      progressUpdateFunc,
    });

    $('cancelDownloadAttachment').addEventListener(
      'click',
      () => {
        cancel();
      },
      false
    );

    const downloadedFile = await success
      .then(
        value => value,
        reason => {
          alert(reason);
        }
      )
      .finally(() => {
        $('cancelDownloadAttachment').hidden = true;
        $set('fileDownloadProgressBar', '0');
      });

    if (downloadedFile) {
      const fileUrl = URL.createObjectURL(downloadedFile);

      // add download button, click it then remove it
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = downloadedFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } catch (error) {
    $set('downloadAttachmentDetails', `Error (See Action Log for Details)`);
    return handleException(error);
  }
}

async function attachThumbnail() {
  const [file] = ($('thumbnailAttachmentInput') as any).files;
  if (!file) {
    return alert('Please attach file first');
  }
  const itemId = $get('thumbnailAddItemId');
  if (!itemId) {
    return alert('Please enter an item id');
  }
  const slotId = $get('thumbnailAddSlotId');
  if (!slotId) {
    return alert('Please enter a slot id');
  }
  const sizeType = $get('thumbnailAddSizeType') as ThumbnailType;
  if (!sizeType || !ThumbnailTypes.includes(sizeType)) {
    return alert('Please enter a thumbnail size/type');
  }
  $set('thumbnailAttachmentInput', '');
  try {
    const vaultUrl = localStorage.getItem('vaultUrl') || '';
    const subscriptionKey = localStorage.getItem('subscriptionKey') || '';
    const privateDek = SymmetricKey.fromSerialized(localStorage.getItem('dataEncryptionKey') || '');
    const vaultAccessToken = localStorage.getItem('vaultAccessToken') || '';
    const oidcAccessToken = localStorage.getItem('oidcAccessToken') || '';
    const keyEncryptionKey = SymmetricKey.fromSerialized(
      localStorage.getItem('keyEncryptionKey') || ''
    );
    const keystoreAccessToken = localStorage.getItem('keystoreAccessToken') || '';

    const environment = new Environment({
      vault: {
        url: vaultUrl,
        subscription_key: subscriptionKey,
      },
      keystore: {
        url: '',
        subscription_key: subscriptionKey,
        provider_api_key: '',
      },
    });

    const itemService = new ItemService(environment);
    const itemFetchResult: any = await itemService.get(
      {
        data_encryption_key: privateDek,
        vault_access_token: vaultAccessToken,
        oidc_token: oidcAccessToken,
        key_encryption_key: keyEncryptionKey,
        keystore_access_token: keystoreAccessToken,
      },
      itemId
    );
    if (!itemFetchResult) {
      return alert('Item not found');
    }
    const attachmentSlot = itemFetchResult.slots.find(slot => slot.id === slotId);
    if (!attachmentSlot) {
      return alert('Slot not found');
    }
    const attachmentSlotValueDek = EncryptionKey.fromSerialized(attachmentSlot.value);
    const thumbnailBuffer = await file.arrayBuffer();

    const thumbnail = await encryptAndUploadThumbnail({
      thumbnail: thumbnailBuffer,
      binaryId: attachmentSlot.attachment_id,
      attachmentDek: attachmentSlotValueDek,
      sizeType,
      authConfig: {
        vault_access_token: vaultAccessToken,
        oidc_token: oidcAccessToken,
        subscription_key: subscriptionKey,
      },
      vaultUrl,
    });

    $set('attachedThumbnailOutput', JSON.stringify({ thumbnail }, null, 2));
  } catch (error) {
    $set('attached', `Error (See Action Log for Details)`);
    return handleException(error);
  }
}

async function thumbnailDownload() {
  const itemId = $get('thumbnailDownloadItemId');
  if (!itemId) {
    return alert('Please enter an item id');
  }
  const slotId = $get('thumbnailDownloadSlotId');
  if (!slotId) {
    return alert('Please enter a slot id');
  }
  const thumbnailId = $get('thumbnailDownloadThumbnailId');
  if (!thumbnailId) {
    return alert('Please enter a thumbnailId');
  }
  try {
    const vaultUrl = localStorage.getItem('vaultUrl') || '';
    const subscriptionKey = localStorage.getItem('subscriptionKey') || '';
    const privateDek = SymmetricKey.fromSerialized(localStorage.getItem('dataEncryptionKey') || '');
    const vaultAccessToken = localStorage.getItem('vaultAccessToken') || '';
    const oidcAccessToken = localStorage.getItem('oidcAccessToken') || '';
    const keyEncryptionKey = SymmetricKey.fromSerialized(
      localStorage.getItem('keyEncryptionKey') || ''
    );
    const keystoreAccessToken = localStorage.getItem('keystoreAccessToken') || '';

    const environment = new Environment({
      vault: {
        url: vaultUrl,
        subscription_key: subscriptionKey,
      },
      keystore: {
        url: '',
        subscription_key: subscriptionKey,
        provider_api_key: '',
      },
    });

    const itemService = new ItemService(environment);
    const itemFetchResult: any = await itemService.get(
      {
        data_encryption_key: privateDek,
        vault_access_token: vaultAccessToken,
        oidc_token: oidcAccessToken,
        key_encryption_key: keyEncryptionKey,
        keystore_access_token: keystoreAccessToken,
      },
      itemId
    );
    if (!itemFetchResult) {
      return alert('Item not found');
    }
    const attachmentSlot = itemFetchResult.slots.find(slot => slot.id === slotId);
    if (!attachmentSlot) {
      return alert('Slot not found');
    }
    const attachmentSlotValueDek = EncryptionKey.fromSerialized(attachmentSlot.value);

    const thumbnailRecord = itemFetchResult.thumbnails.find(
      thumbnail => thumbnail.id === thumbnailId
    );
    const { mimeType, fileExtension } = thumbSizeTypeToMimeExt(thumbnailRecord.size_type);

    const fileBuffer = await downloadThumbnail({
      id: thumbnailId,
      dataEncryptionKey: attachmentSlotValueDek,
      vaultUrl: environment.vault.url,
      authConfig: {
        vault_access_token: vaultAccessToken,
        oidc_token: oidcAccessToken,
        subscription_key: subscriptionKey,
      },
    });

    const blob = new Blob([fileBuffer], { type: mimeType });
    const fileUrl = URL.createObjectURL(blob);

    $('thumbnailDownloadImgOutput').setAttribute('src', fileUrl);

    // add download button, click it then remove it
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = `thumbnail.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    $set('attached', `Error (See Action Log for Details)`);
    return handleException(error);
  }
}

async function handleException(error) {
  console.log(error);
  let errorMessage: string;
  if (error && error.json && typeof error.json === 'function') {
    error = await error.json();
  }
  if (error.message) {
    errorMessage = error.message;
  } else {
    errorMessage = error;
  }
  log(errorMessage);
}

function log(message: string) {
  const content = $get('log');
  const newContent = (content ? content + '\n' : '') + message;
  $set('log', newContent);
  $('log').scrollTop = $('log').scrollHeight;
}
