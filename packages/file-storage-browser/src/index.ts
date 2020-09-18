import * as Cryppo from '@meeco/cryppo';
import {
  AzureBlockDownload,
  directAttachmentAttach,
  directAttachmentUpload,
  directAttachmentUploadUrl,
  downloadAttachment,
  getDirectAttachmentInfo,
} from '@meeco/file-storage-common';
import * as FileUtils from './FileUtils.web';

export async function fileUploadBrowser({
  file,
  vaultUrl,
  vaultAccessToken,
  subscriptionKey,
  videoCodec,
  progressUpdateFunc = null,
}: {
  file: File;
  vaultUrl: string;
  vaultAccessToken: string;
  subscriptionKey: string;
  videoCodec?: string;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void)
    | null;
}): Promise<{ attachment: any; dek: string }> {
  if (progressUpdateFunc) {
    progressUpdateFunc(null, 0);
  }
  const dek = Cryppo.generateRandomKey();
  const authConfig = {
    data_encryption_key: dek,
    vault_access_token: vaultAccessToken,
  };
  const uploadUrl = await directAttachmentUploadUrl(
    {
      fileSize: file.size,
      fileType: file.type,
      fileName: file.name,
    },
    authConfig,
    vaultUrl
  );
  const uploadResult = await directAttachmentUpload(
    {
      directUploadUrl: uploadUrl.url,
      file,
      encrypt: true,
      options: {},
    },
    authConfig,
    FileUtils,
    progressUpdateFunc
  );
  const artifactsFileName = file.name + '.encryption_artifacts';
  if (videoCodec) {
    uploadResult.artifacts['videoCodec'] = videoCodec;
  }
  const artifactsFile = new File(
    [JSON.stringify(uploadResult.artifacts)],
    file.name + '.encryption_artifacts',
    {
      type: 'application/json',
    }
  );
  const artifactsUploadUrl = await directAttachmentUploadUrl(
    {
      fileName: artifactsFileName,
      fileType: 'application/json',
      fileSize: artifactsFile.size,
    },
    authConfig,
    vaultUrl
  );
  await directAttachmentUpload(
    {
      directUploadUrl: artifactsUploadUrl.url,
      file: artifactsFile,
      encrypt: false,
      options: {},
    },
    authConfig,
    FileUtils
  );
  const attachedDoc = await directAttachmentAttach(
    {
      blobId: uploadUrl.blob_id,
      blobKey: uploadUrl.blob_key,
      artifactsBlobId: artifactsUploadUrl.blob_id,
      artifactsBlobKey: artifactsUploadUrl.blob_key,
    },
    authConfig,
    vaultUrl
  );
  return { attachment: attachedDoc.attachment, dek };
}

export async function fileDownloadBrowser({
  attachmentId,
  dek,
  vaultUrl,
  vaultAccessToken,
  subscriptionKey,
  progressUpdateFunc = null,
}: {
  attachmentId: string;
  dek: string;
  vaultUrl: string;
  vaultAccessToken: string;
  subscriptionKey: string;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number, videoCodec?: string) => void)
    | null;
}): Promise<File> {
  if (progressUpdateFunc) {
    progressUpdateFunc(null, 0);
  }
  const authConfig = {
    data_encryption_key: dek,
    vault_access_token: vaultAccessToken,
  };
  const environment = {
    vault: {
      url: vaultUrl,
      subscription_key: subscriptionKey,
    },
  };

  const attachmentInfo = await getDirectAttachmentInfo({ attachmentId }, authConfig, vaultUrl);
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
    const downloaded = await downloadAttachment(
      attachmentId,
      authConfig.vault_access_token,
      authConfig.data_encryption_key,
      vaultUrl
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
  progressUpdateFunc: ((chunkBuffer, percentageComplete, videoCodec?: string) => void) | null
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
  const videoCodec = encrypted_artifact.videoCodec;
  if (progressUpdateFunc && videoCodec) {
    progressUpdateFunc(null, 0, videoCodec);
  }
  client = new AzureBlockDownload(direct_download.url);
  let blocks = new Uint8Array();

  for (let index = 0; index < encrypted_artifact.range.length; index++) {
    const block: any = await client.start(
      dek,
      encrypted_artifact.encryption_stratergy,
      {
        iv: Cryppo.binaryBufferToString(new Uint8Array(encrypted_artifact.iv[index].data)),
        ad: encrypted_artifact.ad,
        at: Cryppo.binaryBufferToString(new Uint8Array(encrypted_artifact.at[index].data)),
      },
      encrypted_artifact.range[index]
    );
    blocks = new Uint8Array([...(blocks as any), ...block]);
    if (progressUpdateFunc) {
      const buffer = block.buffer;
      const percentageComplete = ((index + 1) / encrypted_artifact.range.length) * 100;
      progressUpdateFunc(buffer, percentageComplete, videoCodec);
    }
  }
  return { byteArray: blocks, direct_download };
}

function getDirectDownloadInfo(id: string, type: string, token: string, vaultUrl: string) {
  const options = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Bearer ' + token,
    },
    method: 'GET',
  };
  return fetch(`${vaultUrl}/direct/attachments/${id}/download_url?type=${type}`, options).then(
    res => {
      return res.json();
    }
  );
}
