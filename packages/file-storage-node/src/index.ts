import * as Cryppo from '@meeco/cryppo';
import { AzureBlockDownload, directAttachmentUpload } from '@meeco/file-storage-common';
import { Environment, ItemService } from '@meeco/sdk';
import * as FileType from 'file-type';
import * as fs from 'fs';
import * as path from 'path';

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
      fileName
    },
    authConfig
  );

  const uploadResult = await directAttachmentUpload(
    {
      directUploadUrl: uploadUrl.url,
      file: filePath,
      encrypt: true,
      options: {}
    },
    authConfig
  );

  const artifactsFileName = fileName + '.encryption_artifacts';
  const artifactsFileDir = `./tmp/${artifactsFileName}`;
  fs.writeFileSync(artifactsFileDir, JSON.stringify(uploadResult.artifacts));
  const artifactsFileStats = fs.statSync(artifactsFileDir);

  const artifactsUploadUrl = await service.directAttachmentUploadUrl(
    {
      fileName: artifactsFileName,
      fileType: 'application/json',
      fileSize: artifactsFileStats.size
    },
    authConfig
  );

  await directAttachmentUpload(
    {
      directUploadUrl: artifactsUploadUrl.url,
      file: artifactsFileDir,
      encrypt: false,
      options: {}
    },
    authConfig
  );

  const attachedDoc = await service.directAttachmentAttach(
    {
      blobId: uploadUrl.blob_id,
      blobKey: uploadUrl.blob_key,
      artifactsBlobId: artifactsUploadUrl.blob_id,
      artifactsBlobKey: artifactsUploadUrl.blob_key
    },
    authConfig
  );

  return attachedDoc;
  return '';
}

export async function largeFileDownloadNode(attachmentID, dek, token) {
  const direct_download_encrypted_artifact = await getDirectDownloadInfo(
    attachmentID,
    'encryption_artifact_file',
    token
  );
  const direct_download = await getDirectDownloadInfo(attachmentID, 'binary_file', token);
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
        at: Cryppo.binaryBufferToString(new Uint8Array(encrypted_artifact.at[index].data))
      },
      encrypted_artifact.range[index]
    );
    blocks.push(block);
  }
  const byteArray = Buffer.concat(blocks);
  return { byteArray, direct_download };
}

function getDirectDownloadInfo(id, type, token) {
  const options = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Bearer ' + token
    },
    method: 'GET'
  };

  return fetch(
    `http://localhost:3000/direct/attachments/${id}/download_url?type=${type}`,
    options
  ).then(res => {
    return res.json();
  });
}
