import * as Cryppo from '@meeco/cryppo';
import {
  AzureBlockDownload,
  directAttachmentUpload,
  getDirectAttachmentInfo,
} from '@meeco/file-storage-common';
import { AuthData, Environment, ItemService } from '@meeco/sdk';
import * as FileType from 'file-type';
import * as fs from 'fs';
import * as path from 'path';
import * as FileUtils from './FileUtils.node';

export async function largeFileUploadNode(
  filePath,
  environment: Environment,
  authConfig
): Promise<any> {
  const fileStats = fs.statSync(filePath);
  const fileType = (await FileType.fromFile(filePath))?.mime.toString();
  const fileName = path.basename(filePath);

  const service = new ItemService(environment);

  const uploadUrl = await service.directAttachmentUploadUrl(
    {
      fileSize: fileStats.size,
      fileType: fileType ? fileType : '',
      fileName,
    },
    authConfig
  );

  const uploadResult = await directAttachmentUpload(
    {
      directUploadUrl: uploadUrl.url,
      file: filePath,
      encrypt: true,
      options: {},
    },
    authConfig,
    FileUtils
  );

  const artifactsFileName = fileName + '.encryption_artifacts';
  const artifactsFileDir = `./tmp/${artifactsFileName}`;
  fs.writeFileSync(artifactsFileDir, JSON.stringify(uploadResult.artifacts));
  const artifactsFileStats = fs.statSync(artifactsFileDir);

  const artifactsUploadUrl = await service.directAttachmentUploadUrl(
    {
      fileName: artifactsFileName,
      fileType: 'application/json',
      fileSize: artifactsFileStats.size,
    },
    authConfig
  );

  await directAttachmentUpload(
    {
      directUploadUrl: artifactsUploadUrl.url,
      file: artifactsFileDir,
      encrypt: false,
      options: {},
    },
    authConfig,
    FileUtils
  );

  const attachedDoc = await service.directAttachmentAttach(
    {
      blobId: uploadUrl.blob_id,
      blobKey: uploadUrl.blob_key,
      artifactsBlobId: artifactsUploadUrl.blob_id,
      artifactsBlobKey: artifactsUploadUrl.blob_key,
    },
    authConfig
  );

  return attachedDoc;
}

export async function fileDownloadNode(
  attachmentId: string,
  environment: Environment,
  authConfig: AuthData,
  logFunction: any
): Promise<{ fileName: string; buffer: Buffer }> {
  const service = new ItemService(environment, logFunction);

  const attachmentInfo = await getDirectAttachmentInfo(
    { attachmentId },
    authConfig,
    environment.vault.url
  );
  let buffer: Buffer;
  const fileName: string = attachmentInfo.attachment.filename;
  if (attachmentInfo.attachment.is_direct_upload) {
    // was uploaded in chunks
    const downloaded = await largeFileDownloadNode(
      attachmentId,
      authConfig.data_encryption_key,
      authConfig.vault_access_token,
      environment.vault.url
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
  return { fileName, buffer };
}

export async function largeFileDownloadNode(attachmentID, dek, token, vaultUrl) {
  const direct_download_encrypted_artifact = await getDirectDownloadInfo(
    attachmentID,
    'encryption_artifact_file',
    token,
    vaultUrl
  );
  const direct_download = await getDirectDownloadInfo(attachmentID, 'binary_file', token, vaultUrl);
  let client = new AzureBlockDownload(direct_download_encrypted_artifact.url);
  const encrypted_artifact_uint8array: any = await client.start(null, null, null, null);
  const encrypted_artifact = JSON.parse(encrypted_artifact_uint8array.toString('utf-8'));
  client = new AzureBlockDownload(direct_download.url);
  const blocks: Buffer[] = [];

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
    blocks.push(block);
  }
  const byteArray = Buffer.concat(blocks);
  return { byteArray, direct_download };
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
