import { bytesToBinaryString, bytesToUtf8, EncryptionKey } from '@meeco/cryppo';
import * as Common from '@meeco/file-storage-common';
import {
  AzureBlockDownload,
  buildApiConfig,
  createAttachmentUploadUrl,
  directAttachmentAttach,
  directAttachmentUpload,
  getAttachmentInfo,
  IFileStorageAuthConfiguration,
  ThumbnailType,
} from '@meeco/file-storage-common';
import { DirectAttachmentsApi, ThumbnailResponse } from '@meeco/vault-api-sdk';
import * as fs from 'fs';
import * as mfe from 'mime-file-extension';
import nodeFetch from 'node-fetch';
import * as path from 'path';
import * as FileUtils from './FileUtils.node';

export { ThumbnailType, ThumbnailTypes, thumbSizeTypeToMimeExt } from '@meeco/file-storage-common';

export async function uploadAttachment(
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
  fs.writeFileSync(artifactsFileDir, JSON.stringify(uploadResult.artifacts), 'utf8');
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

export async function downloadAttachment(
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
  // was uploaded in chunks
  const downloaded = await largeFileDownloadNode(
    attachmentId,
    attachmentDek,
    authConfig,
    environment.vault.url
  );
  buffer = downloaded.byteArray;
  return { fileName, buffer };
}

export async function largeFileDownloadNode(
  attachmentID: string,
  dek: EncryptionKey,
  authConfig: IFileStorageAuthConfiguration,
  vaultUrl: string
): Promise<{ byteArray: Buffer; direct_download }> {
  const api = new DirectAttachmentsApi(buildApiConfig(authConfig, vaultUrl, nodeFetch));

  const attachment = await api.directAttachmentsIdGet(attachmentID);
  const artifactsUrl = attachment.attachment.encryption_artifact.url;
  const attachmentInfo = attachment.attachment.main;
  // const {
  //   attachment_direct_download_url: { url: artifactsUrl },
  // } = await api.directAttachmentsIdDownloadUrlGet(attachmentID, 'encryption_artifact_file')
  // const {
  //   attachment_direct_download_url: attachmentInfo,
  // } = await api.directAttachmentsIdDownloadUrlGet(attachmentID, 'binary_file');

  const encryptionArtifacts: any = await AzureBlockDownload.download(
    artifactsUrl,
    authConfig
  ).then((result: any) => JSON.parse(bytesToUtf8(result)));

  const blocks: Buffer[] = [];

  for (let index = 0; index < encryptionArtifacts.range.length; index++) {
    const block: any = await AzureBlockDownload.downloadAndDecrypt(
      attachmentInfo.url,
      authConfig,
      dek,
      encryptionArtifacts.encryption_strategy,
      {
        iv: bytesToBinaryString(new Uint8Array(encryptionArtifacts.iv[index].data)),
        ad: encryptionArtifacts.ad,
        at: bytesToBinaryString(new Uint8Array(encryptionArtifacts.at[index].data)),
      },
      encryptionArtifacts.range[index]
    );
    blocks.push(block);
  }
  const byteArray = Buffer.concat(blocks);
  return { byteArray, direct_download: attachmentInfo };
}

export async function uploadThumbnail({
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

  return Common.uploadThumbnail({
    thumbnail,
    binaryId,
    attachmentDek,
    sizeType,
    authConfig,
    vaultUrl,
    fetchApi: nodeFetch,
  });
}
