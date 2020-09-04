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

  // console.log(uploadResult);

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
  // console.log(
  //   "direct_download_encrypted_artifact : " +
  //     direct_download_encrypted_artifact
  // );
  // console.log("direct_download : " + direct_download);
  // console.log("dek : " + dek);

  let client = new AzureBlockDownload(direct_download_encrypted_artifact.url);
  const encrypted_artifact_uint8array: any = await client.start(null, null, null, null);
  // const encrypted_artifact = JSON.parse(Cryppo.binaryBufferToString(encrypted_artifact_uint8array));
  const encrypted_artifact = encrypted_artifact_uint8array;
  client = new AzureBlockDownload(direct_download.url);
  let blocks = '';

  // console.log("range: " + encrypted_artifact.range);
  // console.log("range lenght: " + encrypted_artifact.range.length);

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
    blocks = blocks.concat(block);
  }
  const buffer = Cryppo.stringAsBinaryBuffer(blocks);
  // const byteArray = new Uint8Array(blocks);
  // const blob = new Blob([byteArray], { type: direct_download.content_type });
  //const blob = new Blob([this.combineBlocks(blocks[0])]);
  // FileSaver.saveAs(blob, direct_download.filename);
  // fs.writeFileSync('something.txt', byteArray);
  return { buffer, direct_download };
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
