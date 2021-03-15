import * as cryppo from '@meeco/cryppo';
import { EncryptionKey } from '@meeco/cryppo';
import * as Common from '@meeco/file-storage-common';
import { AttachmentDirectDownloadUrl, DirectAttachment } from '@meeco/vault-api-sdk';
import * as fs from 'fs';
import * as mfe from 'mime-file-extension';
import * as path from 'path';
import * as FileUtils from './FileUtils.node';

export class AttachmentService extends Common.AttachmentService {
  constructor(vaultUrl: string, _cryppo = cryppo) {
    super(vaultUrl, (url, args) => (<any>global).fetch(url, args));
  }

  async upload(
    filePath: string,
    authConfig: Common.IFileStorageAuthConfiguration
  ): Promise<{ info: DirectAttachment; dek: EncryptionKey }> {
    const fileStats = fs.statSync(filePath);
    const fileName = path.basename(filePath);

    let fileType = '';
    try {
      fileType = mfe.getMimeType(path.extname(filePath));
    } catch {
      // when file type is unknown, default it to 'text/plain'
      fileType = 'text/plain';
    }

    const uploadUrl = await this.createAttachmentUploadUrl(
      {
        fileSize: fileStats.size,
        fileType,
        fileName,
      },
      authConfig
    );

    const dek = EncryptionKey.generateRandom();
    const uploadResult = await this.directAttachmentUpload(
      {
        directUploadUrl: uploadUrl.url,
        file: filePath,
        encrypt: true,
        attachmentDek: dek,
      },
      FileUtils
    );

    const artifactsFileName = fileName + '.encryption_artifacts';
    const artifactsFilePath = path.resolve(artifactsFileName);
    fs.writeFileSync(artifactsFilePath, JSON.stringify(uploadResult.artifacts), 'utf8');
    const artifactsFileStats = fs.statSync(artifactsFilePath);

    const artifactsUploadUrl = await this.createAttachmentUploadUrl(
      {
        fileName: artifactsFileName,
        fileType: 'application/json',
        fileSize: artifactsFileStats.size,
      },
      authConfig
    );

    await this.directAttachmentUpload(
      {
        directUploadUrl: artifactsUploadUrl.url,
        file: artifactsFilePath,
        encrypt: false,
      },
      FileUtils
    );

    const attachedDoc = await this.directAttachmentAttach(
      {
        blobId: uploadUrl.blob_id,
        blobKey: uploadUrl.blob_key,
        artifactsBlobId: artifactsUploadUrl.blob_id,
        artifactsBlobKey: artifactsUploadUrl.blob_key,
      },
      authConfig
    );

    return { info: attachedDoc, dek };
  }

  async download(
    id: string,
    key: EncryptionKey,
    authConfig: Common.IFileStorageAuthConfiguration
  ): Promise<{ data: Buffer; info: AttachmentDirectDownloadUrl }> {
    const { is_direct_upload } = await this.getAttachmentInfo(id, authConfig);

    if (is_direct_upload === false) {
      // deprecated download method
      throw new Error('Unsupported attachment download');
    }

    const { fileInfo, artifactsUrl } = await this.getDownloadMetaData(id, authConfig);

    const encryptionArtifacts: any = await Common.AzureBlockDownload.download(
      artifactsUrl,
      authConfig
    )
      .then(cryppo.bytesToUtf8)
      .then(JSON.parse);

    const blocks: Buffer[] = [];

    for (let index = 0; index < encryptionArtifacts.range.length; index++) {
      const block: any = await Common.AzureBlockDownload.downloadAndDecrypt(
        fileInfo.url,
        authConfig,
        key,
        encryptionArtifacts.encryption_strategy,
        {
          iv: cryppo.bytesToBinaryString(new Uint8Array(encryptionArtifacts.iv[index].data)),
          ad: encryptionArtifacts.ad,
          at: cryppo.bytesToBinaryString(new Uint8Array(encryptionArtifacts.at[index].data)),
        },
        encryptionArtifacts.range[index]
      );
      blocks.push(block);
    }
    const byteArray = Buffer.concat(blocks);
    return { data: byteArray, info: fileInfo };
  }
}
