import { binaryBufferToString, generateRandomKey } from '@meeco/cryppo';
import {
  AzureBlockDownload,
  buildApiConfig,
  directAttachmentAttach,
  directAttachmentUpload,
  directAttachmentUploadUrl,
  downloadAttachment,
  downloadThumbnailCommon,
  encryptAndUploadThumbnailCommon,
  getDirectAttachmentInfo,
  IFileStorageAuthConfiguration,
} from '@meeco/file-storage-common';
import { DirectAttachmentsApi } from '@meeco/vault-api-sdk';
import * as FileUtils from './FileUtils.web';

export { ThumbnailType, ThumbnailTypes, thumbSizeTypeToMimeExt } from '@meeco/file-storage-common';
export { downloadThumbnailCommon as downloadThumbnail };
export { encryptAndUploadThumbnailCommon as encryptAndUploadThumbnail };

export async function fileUploadBrowser({
  file,
  vaultUrl,
  authConfig,
  videoCodec,
  progressUpdateFunc = null,
  onCancel = null,
}: {
  file: File;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  videoCodec?: string;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void)
    | null;
  onCancel?: any;
}): Promise<{ attachment: any; dek: string }> {
  if (progressUpdateFunc) {
    progressUpdateFunc(null, 0);
  }
  const dek = generateRandomKey();
  const uploadUrl = await directAttachmentUploadUrl(
    {
      fileSize: file.size,
      fileType: file.type,
      fileName: file.name,
    },
    authConfig,
    vaultUrl,
    undefined
  );
  const uploadResult = await directAttachmentUpload(
    {
      directUploadUrl: uploadUrl.attachment_direct_upload_url.url,
      file,
      encrypt: true,
      attachmentDek: dek,
    },
    FileUtils,
    progressUpdateFunc,
    onCancel
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
      directUploadUrl: artifactsUploadUrl.attachment_direct_upload_url.url,
      file: artifactsFile,
      encrypt: false,
    },
    FileUtils,
    null,
    onCancel
  );
  const attachedDoc = await directAttachmentAttach(
    {
      blobId: uploadUrl.attachment_direct_upload_url.blob_id,
      blobKey: uploadUrl.attachment_direct_upload_url.blob_key,
      artifactsBlobId: artifactsUploadUrl.attachment_direct_upload_url.blob_id,
      artifactsBlobKey: artifactsUploadUrl.attachment_direct_upload_url.blob_key,
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
  authConfig,
  progressUpdateFunc = null,
  onCancel = null,
}: {
  attachmentId: string;
  dek: string;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number, videoCodec?: string) => void)
    | null;
  onCancel?: any;
}): Promise<File> {
  if (progressUpdateFunc) {
    progressUpdateFunc(null, 0);
  }

  const environment = {
    vault: {
      url: vaultUrl,
    },
  };

  const attachmentInfo = await getDirectAttachmentInfo({ attachmentId }, authConfig, vaultUrl);
  let buffer: Uint8Array;
  const fileName: string = attachmentInfo.attachment.filename;
  if (attachmentInfo.attachment.is_direct_upload) {
    // was uploaded in chunks
    const downloaded = await largeFileDownloadBrowser(
      attachmentId,
      dek,
      authConfig,
      environment.vault.url,
      progressUpdateFunc,
      onCancel
    );
    buffer = downloaded.byteArray;
  } else {
    // was not uploaded in chunks
    const downloaded = await downloadAttachment(attachmentId, authConfig, vaultUrl);
    buffer = Buffer.from(downloaded as string);
  }
  return new File([buffer], fileName, {
    type: attachmentInfo.attachment.content_type,
  });
}

async function largeFileDownloadBrowser(
  attachmentID: string,
  dek: string | null,
  authConfig: IFileStorageAuthConfiguration,
  vaultUrl: string,
  progressUpdateFunc: ((chunkBuffer, percentageComplete, videoCodec?: string) => void) | null,
  onCancel?: any
) {
  const direct_download_encrypted_artifact = await getDirectDownloadInfo(
    attachmentID,
    'encryption_artifact_file',
    authConfig,
    vaultUrl
  );
  const direct_download = await getDirectDownloadInfo(
    attachmentID,
    'binary_file',
    authConfig,
    vaultUrl
  );
  let client = new AzureBlockDownload(direct_download_encrypted_artifact.url);
  const encrypted_artifact_uint8array: any = await client.start(null, null, null, null, onCancel);
  const encrypted_artifact = JSON.parse(binaryBufferToString(encrypted_artifact_uint8array));
  const videoCodec = encrypted_artifact.videoCodec;
  if (progressUpdateFunc && videoCodec) {
    progressUpdateFunc(null, 0, videoCodec);
  }
  client = new AzureBlockDownload(direct_download.url);
  let blocks = new Uint8Array();

  for (let index = 0; index < encrypted_artifact.range.length; index++) {
    const block: any = await client.start(
      dek,
      encrypted_artifact.encryption_strategy,
      {
        iv: binaryBufferToString(new Uint8Array(encrypted_artifact.iv[index].data)),
        ad: encrypted_artifact.ad,
        at: binaryBufferToString(new Uint8Array(encrypted_artifact.at[index].data)),
      },
      encrypted_artifact.range[index],
      onCancel
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

async function getDirectDownloadInfo(
  id: string,
  type: string,
  authConfig: IFileStorageAuthConfiguration,
  vaultUrl: string
) {
  const api = new DirectAttachmentsApi(buildApiConfig(authConfig, vaultUrl));
  const result = await api.directAttachmentsIdDownloadUrlGet(id, type);
  return result.attachment_direct_download_url;
}

export function fileDownloadBrowserWithCancel({
  attachmentId,
  dek,
  vaultUrl,
  authConfig,
  progressUpdateFunc = null,
}: {
  attachmentId: string;
  dek: string;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number, videoCodec?: string) => void)
    | null;
}) {
  let cancel;
  const promise = new Promise((resolve, reject) => (cancel = () => resolve('cancel')));
  return {
    cancel,
    success: fileDownloadBrowser({
      attachmentId,
      dek,
      vaultUrl,
      authConfig,
      progressUpdateFunc,
      onCancel: promise,
    }),
  };
}

export function fileUploadBrowserWithCancel({
  file,
  vaultUrl,
  authConfig,
  videoCodec,
  progressUpdateFunc = null,
}: {
  file: File;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  videoCodec?: string;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void)
    | null;
}) {
  let cancel;
  const promise = new Promise((resolve, reject) => (cancel = () => resolve('cancel')));
  return {
    cancel,
    success: fileUploadBrowser({
      file,
      vaultUrl,
      authConfig,
      videoCodec,
      progressUpdateFunc,
      onCancel: promise,
    }),
  };
}
