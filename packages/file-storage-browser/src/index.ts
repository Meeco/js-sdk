import * as Cryppo from '@meeco/cryppo';
import {
  AzureBlockDownload,
  directAttachmentAttach,
  directAttachmentUpload,
  directAttachmentUploadUrl
} from '@meeco/file-storage-common';
import { AuthData, EncryptionKey, Environment, ItemService } from '@meeco/sdk';
import * as FileUtils from './FileUtils.web';
export { Environment } from '@meeco/sdk';

export async function fileUploadBrowser({
  file,
  dek,
  vaultUrl,
  vaultAccessToken,
  subscriptionKey
}: {
  file: File;
  dek: string;
  vaultUrl: string;
  vaultAccessToken: string;
  subscriptionKey: string;
}): Promise<any> {
  const authConfig = new AuthData({
    data_encryption_key: EncryptionKey.fromSerialized(dek),
    key_encryption_key: EncryptionKey.fromRaw(''),
    keystore_access_token: '',
    passphrase_derived_key: EncryptionKey.fromRaw(''),
    secret: '',
    vault_access_token: vaultAccessToken
  });
  const uploadUrl = await directAttachmentUploadUrl(
    {
      fileSize: file.size,
      fileType: file.type,
      fileName: file.name
    },
    authConfig,
    vaultUrl
  );
  const uploadResult = await directAttachmentUpload(
    {
      directUploadUrl: uploadUrl.url,
      file,
      encrypt: true,
      options: {}
    },
    authConfig,
    FileUtils
  );
  console.log(uploadResult);
  const artifactsFileName = file.name + '.encryption_artifacts';
  // const artifactsFileDir = `./tmp/${artifactsFileName}`;
  const artifactsFile = new File(
    [JSON.stringify(uploadResult.artifacts)],
    file.name + '.encryption_artifacts',
    {
      type: 'application/json'
    }
  );
  // const artifactsFileStats = fs.statSync(artifactsFileDir);
  const artifactsUploadUrl = await directAttachmentUploadUrl(
    {
      fileName: artifactsFileName,
      fileType: 'application/json',
      fileSize: artifactsFile.size
    },
    authConfig,
    vaultUrl
  );
  await directAttachmentUpload(
    {
      directUploadUrl: artifactsUploadUrl.url,
      file: artifactsFile,
      encrypt: false,
      options: {}
    },
    authConfig,
    FileUtils
  );
  const attachedDoc = await directAttachmentAttach(
    {
      blobId: uploadUrl.blob_id,
      blobKey: uploadUrl.blob_key,
      artifactsBlobId: artifactsUploadUrl.blob_id,
      artifactsBlobKey: artifactsUploadUrl.blob_key
    },
    authConfig,
    vaultUrl
  );
  return attachedDoc;
}

export async function fileDownloadBrowser({
  attachmentId,
  dek,
  vaultUrl,
  vaultAccessToken,
  subscriptionKey,
  progressUpdateFunc = null
}: {
  attachmentId: string;
  dek: string;
  vaultUrl: string;
  vaultAccessToken: string;
  subscriptionKey: string;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void)
    | null;
}): Promise<File> {
  if (progressUpdateFunc) {
    progressUpdateFunc(null, 0);
  }
  const authConfig = new AuthData({
    data_encryption_key: EncryptionKey.fromSerialized(dek),
    key_encryption_key: EncryptionKey.fromRaw(''),
    keystore_access_token: '',
    passphrase_derived_key: EncryptionKey.fromRaw(''),
    secret: '',
    vault_access_token: vaultAccessToken
  });
  const environment = new Environment({
    vault: {
      url: vaultUrl,
      subscription_key: subscriptionKey
    },
    keystore: {
      url: '',
      subscription_key: subscriptionKey,
      provider_api_key: ''
    }
  });

  const service = new ItemService(environment);

  const attachmentInfo = await service.getDirectAttachmentInfo({ attachmentId }, authConfig);
  let buffer: Uint8Array;
  const fileName: string = attachmentInfo.attachment.filename;
  if (attachmentInfo.attachment.is_direct_upload) {
    // was uploaded in chunks
    const downloaded = await largeFileDownloadBrowser(
      attachmentId,
      authConfig.data_encryption_key,
      authConfig.vault_access_token,
      environment.vault.url,
      progressUpdateFunc
    );
    buffer = downloaded.byteArray;
  } else {
    // was not uploaded in chunks
    const downloaded = await service.downloadAttachment(
      attachmentId,
      authConfig.vault_access_token,
      authConfig.data_encryption_key
    );
    buffer = Buffer.from(downloaded);
  }
  return new File([buffer], fileName);
}

async function largeFileDownloadBrowser(
  attachmentID,
  dek,
  token,
  vaultUrl,
  progressUpdateFunc: ((chunkBuffer, percentageComplete) => void) | null
) {
  const direct_download_encrypted_artifact = await getDirectDownloadInfo(
    attachmentID,
    'encryption_artifact_file',
    token,
    vaultUrl
  );
  const direct_download = await getDirectDownloadInfo(attachmentID, 'binary_file', token, vaultUrl);
  let client = new AzureBlockDownload(direct_download_encrypted_artifact.url);
  const encrypted_artifact_uint8array: any = await client.start(null, null, null, null);
  const encrypted_artifact = JSON.parse(Cryppo.binaryBufferToString(encrypted_artifact_uint8array));
  client = new AzureBlockDownload(direct_download.url);
  let blocks = new Uint8Array();

  for (let index = 0; index < encrypted_artifact.range.length; index++) {
    const block: any = await client.start(
      dek,
      encrypted_artifact.encryption_stratergy,
      {
        iv: Cryppo.binaryBufferToString(new Uint8Array(encrypted_artifact.iv[index].data)),
        ad: encrypted_artifact.ad,
        at: Cryppo.binaryBufferToString(new Uint8Array(encrypted_artifact.at[index].data))
      },
      encrypted_artifact.range[index]
    );
    blocks = new Uint8Array([...blocks, ...block]);
    if (progressUpdateFunc) {
      const buffer = block.buffer;
      const percentageComplete = ((index + 1) / encrypted_artifact.range.length) * 100;
      progressUpdateFunc(buffer, percentageComplete);
    }
  }
  return { byteArray: blocks, direct_download };
}

function getDirectDownloadInfo(id: string, type: string, token: string, vaultUrl: string) {
  const options = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Bearer ' + token
    },
    method: 'GET'
  };
  return fetch(`${vaultUrl}/direct/attachments/${id}/download_url?type=${type}`, options).then(
    res => {
      return res.json();
    }
  );
}
