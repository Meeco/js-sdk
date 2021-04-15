import * as cryppo from '@meeco/cryppo';
import { EncryptionKey } from '@meeco/cryppo';
import * as Common from '@meeco/file-storage-common';
import { AttachmentDirectDownloadUrl, DirectAttachment } from '@meeco/vault-api-sdk';
import * as fs from 'fs';
import * as mfe from 'mime-file-extension';
import * as path from 'path';
import * as FileUtils from './FileUtils.node';
import fetch from 'node-fetch';

export class AttachmentService extends Common.AttachmentService {
  constructor(vaultUrl: string, _cryppo = cryppo) {
    super(vaultUrl, (url, args) => fetch(url, args));
  }

  /**
   * Upload a file attachment from local disk.
   * Side effect is that encryption meta data is written to [filePath].encryption_artifacts
   * @param key If not provided uses a randomly generated key (returned in result).
   * @param cancel a Promise that cancels upload if resolved.
   */
  async upload({
    filePath,
    authConfig,
    key,
    progressUpdateFunc,
    cancel,
  }: {
    filePath: string;
    authConfig: Common.IFileStorageAuthConfiguration;
    key: EncryptionKey;
    progressUpdateFunc?: (chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void;
    cancel?: Promise<void>;
  }): Promise<DirectAttachment> {
    const fileStats = fs.statSync(filePath);
    const fileName = path.basename(filePath);

    let fileType = '';
    try {
      fileType = mfe.getMimeType(path.extname(filePath));
    } catch {
      // when file type is unknown, default it to 'text/plain'
      fileType = 'text/plain';
    }

    const uploadUrl = await this.createUploadUrl(
      {
        fileSize: fileStats.size,
        fileType,
        fileName,
      },
      authConfig
    );

    const uploadResult = await this.uploadBlocks(
      {
        directUploadUrl: uploadUrl.url,
        file: filePath,
        encrypt: true,
        attachmentDek: key,
      },
      FileUtils
    );

    const artifactsFileName = fileName + '.encryption_artifacts';
    const artifactsFilePath = path.resolve(artifactsFileName);
    fs.writeFileSync(artifactsFilePath, JSON.stringify(uploadResult.artifacts), 'utf8');
    const artifactsFileStats = fs.statSync(artifactsFilePath);

    const artifactsUploadUrl = await this.createUploadUrl(
      {
        fileName: artifactsFileName,
        fileType: 'application/json',
        fileSize: artifactsFileStats.size,
      },
      authConfig
    );

    await this.uploadBlocks(
      {
        directUploadUrl: artifactsUploadUrl.url,
        file: artifactsFilePath,
        encrypt: false,
      },
      FileUtils,
      progressUpdateFunc,
      cancel
    );

    const attachedDoc = await this.linkArtifacts(
      {
        blobId: uploadUrl.blob_id,
        blobKey: uploadUrl.blob_key,
      },
      {
        blobId: artifactsUploadUrl.blob_id,
        blobKey: artifactsUploadUrl.blob_key,
      },
      authConfig
    );

    return attachedDoc;
  }

  /**
   * @param id UUID of the attachment to download.
   * @param key Used to decrypt the file. Usually this is stored in the `encrypted_value` attribute of the "attachment" slot.
   * @param cancel a Promise that cancels upload if resolved.
   */
  async download({
    id,
    key,
    authConfig,
    progressUpdateFunc,
    cancel,
  }: {
    id: string;
    key: EncryptionKey;
    authConfig: Common.IFileStorageAuthConfiguration;
    progressUpdateFunc?: (percentageComplete: number) => void;
    cancel?: Promise<any>;
  }): Promise<{ data: Buffer; info: AttachmentDirectDownloadUrl }> {
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
      .then(JSON.parse); // TODO merge this into AzureBlock API -- just return a JSON

    const blocks: Buffer[] = [];
    const totalBlocks = encryptionArtifacts.range.length;

    for (let index = 0; index < totalBlocks; index++) {
      const block: any = await Common.AzureBlockDownload.downloadAndDecrypt(
        fileInfo.url,
        authConfig,
        key,
        encryptionArtifacts.encryption_strategy,
        {
          // TODO is there a native way to do this?
          iv: cryppo.bytesToBinaryString(new Uint8Array(encryptionArtifacts.iv[index].data)),
          ad: encryptionArtifacts.ad,
          at: cryppo.bytesToBinaryString(new Uint8Array(encryptionArtifacts.at[index].data)),
        },
        encryptionArtifacts.range[index],
        cancel
      );
      blocks.push(block);

      const progress = (index + 1) / totalBlocks;
      if (progressUpdateFunc) {
        progressUpdateFunc(progress * 100);
      }
    }
    const byteArray = Buffer.concat(blocks);
    return { data: byteArray, info: fileInfo };
  }
}
