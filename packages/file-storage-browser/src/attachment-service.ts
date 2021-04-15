import { bytesBufferToBinaryString, EncryptionKey } from '@meeco/cryppo';
import * as Common from '@meeco/file-storage-common';
import { AzureBlockDownload, IFileStorageAuthConfiguration } from '@meeco/file-storage-common';
import { DirectAttachment } from '@meeco/vault-api-sdk';
import * as FileUtils from './FileUtils.web';

export class AttachmentService extends Common.AttachmentService {
  constructor(vaultUrl: string) {
    super(vaultUrl, fetch);
  }

  /**
   * Upload a new attachment. It is encrypted with a random DEK that is returned with the attachment
   * metadata.
   * This DEK should usually be stored in the `value` attribute of an attachment Slot:
   * ```typescript
   *      slots: [
   *        {
   *          label,
   *          slot_type_name: 'attachment',
   *          attachment_attributes: {
   *            id: attachment.id,
   *          },
   *          value: attachmentDek.serialize,
   *        },
   *      ],
   * ```
   *
   * @param {object} __namedParameters Options
   * @param file
   * @param authConfig Contains the auth tokens.
   * @param key Data Encryption Key used to encrypt the attachment.
   * @param videoCodec Optionally record the video codec in attachment metadata.
   * @param progressUpdateFunc reporter callback.
   * @param onCancel Promise that, if resolved, cancels the upload.
   * @returns Attachment metadata
   */
  async upload({
    file,
    authConfig,
    key,
    videoCodec,
    progressUpdateFunc,
    cancel,
  }: {
    file: File;
    authConfig: IFileStorageAuthConfiguration;
    key: EncryptionKey;
    videoCodec?: string;
    progressUpdateFunc?: (chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void;
    cancel?: Promise<any>;
  }): Promise<DirectAttachment> {
    if (progressUpdateFunc) {
      progressUpdateFunc(null, 0);
    }

    // upload the attachment
    const uploadUrl = await this.createUploadUrl(
      {
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name,
      },
      authConfig
    );
    const uploadResult = await this.uploadBlocks(
      {
        directUploadUrl: uploadUrl.url,
        file,
        encrypt: true,
        attachmentDek: key,
      },
      FileUtils,
      progressUpdateFunc,
      cancel
    );

    // upload encryption artefacts
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

    const artifactsUploadUrl = await this.createUploadUrl(
      {
        fileName: artifactsFileName,
        fileType: 'application/json',
        fileSize: artifactsFile.size,
      },
      authConfig
    );
    await this.uploadBlocks(
      {
        directUploadUrl: artifactsUploadUrl.url,
        file: artifactsFile,
        encrypt: false,
      },
      FileUtils,
      null,
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
   * @param authConfig Contains the auth headers/tokens.
   * @param cancel Promise that, if resolved, cancels the download.
   */
  async download({
    id,
    key,
    authConfig,
    progressUpdateFunc = null,
    cancel,
  }: {
    id: string;
    key: EncryptionKey;
    authConfig: IFileStorageAuthConfiguration;
    progressUpdateFunc?:
      | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number, videoCodec?: string) => void)
      | null;
    cancel?: Promise<any>;
  }): Promise<File> {
    if (progressUpdateFunc) {
      progressUpdateFunc(null, 0);
    }

    const attachmentInfo = await this.getAttachmentInfo(id, authConfig);

    let buffer: Uint8Array;
    const fileName: string = attachmentInfo.filename;
    if (attachmentInfo.is_direct_upload) {
      // was uploaded in chunks
      const downloaded = await this.largeFileDownloadBrowser(
        id,
        key,
        authConfig,
        progressUpdateFunc,
        cancel
      );
      buffer = downloaded.byteArray;
    } else {
      // legacy file upload no longer supported
      throw new Error('Unsupported attachment download');
    }

    return new File([buffer], fileName, {
      type: attachmentInfo.content_type,
    });
  }

  /**
   * Download a file in chunks from Azure block storage. See [[AzureBlockDownload]]
   */
  private async largeFileDownloadBrowser(
    attachmentID: string,
    dek: EncryptionKey,
    authConfig: IFileStorageAuthConfiguration,
    progressUpdateFunc:
      | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number, videoCodec?: string) => void)
      | null,
    onCancel?: any
  ) {
    const { artifactsUrl, fileInfo: attachmentInfo } = await this.getDownloadMetaData(
      attachmentID,
      authConfig
    );

    // download encryption artifacts
    const encryptionArtifacts = await AzureBlockDownload.download(
      artifactsUrl,
      authConfig,
      undefined,
      onCancel
    ).then((resultBuffer: any) => JSON.parse(bytesBufferToBinaryString(resultBuffer)));

    const videoCodec = encryptionArtifacts.videoCodec;

    if (progressUpdateFunc && videoCodec) {
      progressUpdateFunc(null, 0, videoCodec);
    }

    // use encryption artifacts to initiate file download
    let blocks = new Uint8Array();
    for (let index = 0; index < encryptionArtifacts.range.length; index++) {
      const block = await AzureBlockDownload.downloadAndDecrypt(
        attachmentInfo.url,
        authConfig,
        dek,
        encryptionArtifacts.encryption_strategy,
        {
          iv: bytesBufferToBinaryString(new Uint8Array(encryptionArtifacts.iv[index].data)),
          ad: encryptionArtifacts.ad,
          at: bytesBufferToBinaryString(new Uint8Array(encryptionArtifacts.at[index].data)),
        },
        encryptionArtifacts.range[index],
        onCancel
      );
      // TODO: instead of copying the buffer every loop, should use size info to create the correct sized buffer initially!
      blocks = new Uint8Array([...(blocks as any), ...block]);
      if (progressUpdateFunc) {
        const buffer = block.buffer;
        const percentageComplete = ((index + 1) / encryptionArtifacts.range.length) * 100;
        progressUpdateFunc(buffer, percentageComplete, videoCodec);
      }
    }

    return { byteArray: blocks, attachmentInfo };
  }
}
