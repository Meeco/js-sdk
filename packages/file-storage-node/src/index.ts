import { bytesToBinaryString, EncryptionKey } from '@meeco/cryppo';
import {
  AzureBlockDownload,
  buildApiConfig,
  createAttachmentUploadUrl,
  directAttachmentAttach,
  directAttachmentUpload,
  downloadAttachment,
  downloadThumbnail as downloadThumbnailCommon,
  getAttachmentInfo,
  IFileStorageAuthConfiguration,
  ThumbnailType,
  uploadThumbnail as encryptAndUploadThumbnailCommon,
} from '@meeco/file-storage-common';
import {
  DirectAttachmentsApi,
  AttachmentDirectDownloadUrl,
  ThumbnailResponse,
} from '@meeco/vault-api-sdk';
import * as fs from 'fs';
import * as mfe from 'mime-file-extension';
import nodeFetch from 'node-fetch';
import * as path from 'path';
import * as FileUtils from './FileUtils.node';

export { ThumbnailType, ThumbnailTypes, thumbSizeTypeToMimeExt } from '@meeco/file-storage-common';

export async function largeFileUploadNode(
  filePath: string,
  environment: {
    vault: {
      url: string;
    };
  },
  authConfig: IFileStorageAuthConfiguration
): Promise<{ attachment: any; dek: EncryptionKey }> {
  const fileStats = fs.statSync(filePath);
  let fileType: string;
  const fileName = path.basename(filePath);

  try {
    fileType = mfe.getMimeType(path.extname(filePath));
  } catch {
    // when file type is unknown, default it to 'text/plain'
    fileType = 'text/plain';
  }

  const uploadUrl = await createAttachmentUploadUrl(
    {
      fileSize: fileStats.size,
      fileType: fileType ? fileType : '',
      fileName,
    },
    authConfig,
    environment.vault.url,
    nodeFetch
  );
  const dek = EncryptionKey.generateRandom();
  const uploadResult = await directAttachmentUpload(
    {
      directUploadUrl: uploadUrl.url,
      file: filePath,
      encrypt: true,
      attachmentDek: dek,
    },
    FileUtils
  );

  const artifactsFileName = fileName + '.encryption_artifacts';
  const artifactsFileDir = `./${artifactsFileName}`;
  fs.writeFileSync(artifactsFileDir, JSON.stringify(uploadResult.artifacts));
  const artifactsFileStats = fs.statSync(artifactsFileDir);

  const artifactsUploadUrl = await createAttachmentUploadUrl(
    {
      fileName: artifactsFileName,
      fileType: 'application/json',
      fileSize: artifactsFileStats.size,
    },
    authConfig,
    environment.vault.url,
    nodeFetch
  );

  await directAttachmentUpload(
    {
      directUploadUrl: artifactsUploadUrl.url,
      file: artifactsFileDir,
      encrypt: false,
    },
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
    environment.vault.url,
    nodeFetch
  );

  return { attachment: attachedDoc, dek };
}

export async function fileDownloadNode(
  attachmentId: string,
  environment: {
    vault: {
      url: string;
    };
  },
  authConfig: IFileStorageAuthConfiguration,
  attachmentDek: EncryptionKey,
  logFunction?: any
): Promise<{ fileName: string; buffer: Buffer }> {
  const attachmentInfo = await getAttachmentInfo(
    attachmentId,
    authConfig,
    environment.vault.url,
    nodeFetch
  );
  let buffer: Buffer;
  const fileName: string = attachmentInfo.filename;
  if (attachmentInfo.is_direct_upload) {
    // was uploaded in chunks
    const downloaded = await largeFileDownloadNode(
      attachmentId,
      attachmentDek,
      authConfig,
      environment.vault.url
    );
    buffer = downloaded.byteArray;
  } else {
    const downloaded = await downloadAttachment(
      attachmentId,
      attachmentDek,
      authConfig,
      environment.vault.url
    );
    buffer = Buffer.from(downloaded || '');
  }
  return { fileName, buffer };
}

export async function largeFileDownloadNode(
  attachmentID: string,
  dek: EncryptionKey,
  authConfig: IFileStorageAuthConfiguration,
  vaultUrl: string
): Promise<{ byteArray: Buffer; direct_download: AttachmentDirectDownloadUrl }> {
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
  const encrypted_artifact_uint8array: any = await client.start(null, null, null, null);
  const encrypted_artifact = JSON.parse(encrypted_artifact_uint8array.toString('utf-8'));
  client = new AzureBlockDownload(direct_download.url);
  const blocks: Buffer[] = [];

  for (let index = 0; index < encrypted_artifact.range.length; index++) {
    const block: any = await client.start(
      dek,
      encrypted_artifact.encryption_strategy,
      {
        iv: bytesToBinaryString(new Uint8Array(encrypted_artifact.iv[index].data)),
        ad: encrypted_artifact.ad,
        at: bytesToBinaryString(new Uint8Array(encrypted_artifact.at[index].data)),
      },
      encrypted_artifact.range[index]
    );
    blocks.push(block);
  }
  const byteArray = Buffer.concat(blocks);
  return { byteArray, direct_download };
}

async function getDirectDownloadInfo(
  id: string,
  type: string,
  authConfig: IFileStorageAuthConfiguration,
  vaultUrl: string
) {
  const api = new DirectAttachmentsApi(buildApiConfig(authConfig, vaultUrl, nodeFetch));
  const result = await api.directAttachmentsIdDownloadUrlGet(id, type);
  return result.attachment_direct_download_url;
}

export async function encryptAndUploadThumbnail({
  thumbnailFilePath,
  binaryId,
  attachmentDek,
  sizeType,
  authConfig,
  vaultUrl,
}: {
  thumbnailFilePath: string;
  binaryId: string;
  attachmentDek: EncryptionKey;
  sizeType: ThumbnailType;
  authConfig: IFileStorageAuthConfiguration;
  vaultUrl: string;
}): Promise<ThumbnailResponse> {
  const thumbnail = fs.readFileSync(thumbnailFilePath);

  return encryptAndUploadThumbnailCommon({
    thumbnail,
    binaryId,
    attachmentDek,
    sizeType,
    authConfig,
    vaultUrl,
    fetchApi: nodeFetch,
  });
}

export async function downloadThumbnail({
  id,
  dataEncryptionKey,
  vaultUrl,
  authConfig,
}: {
  id: string;
  dataEncryptionKey: EncryptionKey;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
}): Promise<Uint8Array> {
  return downloadThumbnailCommon({
    id,
    dataEncryptionKey,
    vaultUrl,
    authConfig,
    fetchApi: nodeFetch,
  });
}
