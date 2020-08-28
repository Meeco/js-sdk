import { directAttachmentUpload } from '@meeco/large-file-upload-common';
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

  console.log(uploadResult);

  // const artifactsFileName = fileName + '.encryption_artifacts';
  // const artifactsFileDir = `./tmp/${artifactsFileName}`;
  // fs.writeFileSync(artifactsFileDir, JSON.stringify(uploadResult.artifacts));
  // const artifactsFileStats = fs.statSync(artifactsFileDir);

  // const artifactsUploadUrl = await service.directAttachmentUploadUrl(
  //   {
  //     fileName: artifactsFileName,
  //     fileType: 'application/json',
  //     fileSize: artifactsFileStats.size
  //   },
  //   authConfig
  // );

  // await service.directAttachmentUpload(
  //   {
  //     directUploadUrl: artifactsUploadUrl.url,
  //     file: artifactsFileDir,
  //     encrypt: false,
  //     options: {}
  //   },
  //   authConfig
  // );

  // const attachedDoc = await service.directAttachmentAttach(
  //   {
  //     blobId: uploadUrl.blob_id,
  //     blobKey: uploadUrl.blob_key,
  //     artifactsBlobId: artifactsUploadUrl.blob_id,
  //     artifactsBlobKey: artifactsUploadUrl.blob_key
  //   },
  //   authConfig
  // );

  // return attachedDoc;
  return '';
}
