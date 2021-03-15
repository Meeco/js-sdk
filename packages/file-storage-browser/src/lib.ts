import { bytesBufferToBinaryString, EncryptionKey } from '@meeco/cryppo';
import {
  AzureBlockDownload,
  buildApiConfig,
  IFileStorageAuthConfiguration,
} from '@meeco/file-storage-common';
import * as Common from '@meeco/file-storage-common';
import { DirectAttachment, DirectAttachmentsApi } from '@meeco/vault-api-sdk';
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
   * @param authConfig Contains the DEK and the appropriate auth tokens.
   * @param videoCodec Optionally record the video codec in attachment metadata.
   * @param progressUpdateFunc reporter callback
   * @param onCancel Promise that, if resolved, cancels the upload.
   * @returns Attachment metadata and the encryption key used to encrypt the attachment data.
   */
  async upload({
    file,
    authConfig,
    videoCodec,
    progressUpdateFunc = null,
    onCancel,
  }: {
    file: File;
    authConfig: IFileStorageAuthConfiguration;
    videoCodec?: string;
    progressUpdateFunc?:
      | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void)
      | null;
    onCancel?: Promise<any>;
  }): Promise<{ attachment: DirectAttachment; dek: EncryptionKey }> {
    if (progressUpdateFunc) {
      progressUpdateFunc(null, 0);
    }

    const dek = EncryptionKey.generateRandom();

    // upload the attachment
    const uploadUrl = await this.createAttachmentUploadUrl(
      {
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name,
      },
      authConfig
    );
    const uploadResult = await this.directAttachmentUpload(
      {
        directUploadUrl: uploadUrl.url,
        file,
        encrypt: true,
        attachmentDek: dek,
      },
      FileUtils,
      progressUpdateFunc,
      onCancel
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

    const artifactsUploadUrl = await this.createAttachmentUploadUrl(
      {
        fileName: artifactsFileName,
        fileType: 'application/json',
        fileSize: artifactsFile.size,
      },
      authConfig
    );
    await this.directAttachmentUpload(
      {
        directUploadUrl: artifactsUploadUrl.url,
        file: artifactsFile,
        encrypt: false,
      },
      FileUtils,
      null,
      onCancel
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
    return { attachment: attachedDoc, dek };
  }

  /**
   * Download a file either from Azure block storage (direct upload) or the legacy storage.
   * @param {object} __namedParameters Options
   * @param dek Usually this is stored in the `encrypted_value` attribute of the "attachment" slot.
   * @param authConfig Contains the DEK and the appropriate auth tokens.
   * @param progressUpdateFunc TODO not used in regular case!
   * @param onCancel Promise that, if resolved, cancels the download.
   */
  async download({
    attachmentId,
    dek,
    authConfig,
    progressUpdateFunc = null,
    onCancel,
  }: {
    attachmentId: string;
    dek: EncryptionKey;
    authConfig: IFileStorageAuthConfiguration;
    progressUpdateFunc?:
      | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number, videoCodec?: string) => void)
      | null;
    onCancel?: Promise<any>;
  }): Promise<File> {
    if (progressUpdateFunc) {
      progressUpdateFunc(null, 0);
    }

    const attachmentInfo = await this.getAttachmentInfo(attachmentId, authConfig);

    let buffer: Uint8Array;
    const fileName: string = attachmentInfo.filename;
    if (attachmentInfo.is_direct_upload) {
      // was uploaded in chunks
      const downloaded = await this.largeFileDownloadBrowser(
        attachmentId,
        dek,
        authConfig,
        progressUpdateFunc,
        onCancel
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

  /**
   * Wraps [[fileDownloadBrowser]] injecting a callable function that will cancel the action.
   * For example
   * ```typescript
   * const { cancel, success } = fileDownloadBrowserWithCancel(...);
   * cancel(); // kills download
   * file = await success // original result
   * ```
   * @returns An object with attributes `cancel`: the function to cancel the download, `success` contains
   * the original result promise.
   */
  public fileDownloadBrowserWithCancel = withCancel<
    {
      attachmentId: string;
      dek: EncryptionKey;
      authConfig: IFileStorageAuthConfiguration;
      progressUpdateFunc?:
        | ((
            chunkBuffer: ArrayBuffer | null,
            percentageComplete: number,
            videoCodec?: string
          ) => void)
        | null;
    },
    Promise<File>
  >(args => this.download(args));

  /**
   * Wraps [[fileUploadBrowser]] injecting a callable function that will cancel the action.
   * @returns An object with attributes `cancel`: the function to cancel the upload, `success` contains
   * the original result promise.
   */
  public fileUploadBrowserWithCancel = withCancel<
    {
      file: File;
      authConfig: IFileStorageAuthConfiguration;
      videoCodec?: string;
      progressUpdateFunc?:
        | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void)
        | null;
    },
    Promise<{ attachment: any; dek: EncryptionKey }>
  >(args => this.upload(args));
}

/**
 * Injects a function that can be used to cancel a long running download/upload.
 * Argument function "f" must have named param "onCancel".
 */
export function withCancel<S, T>(
  f: (_: S & { onCancel?: any }) => T
): (_: S) => { cancel: () => void; success: T } {
  return (x: S) => {
    let cancel;
    const promise = new Promise((resolve, reject) => (cancel = () => resolve('cancel')));
    return {
      cancel,
      success: f({
        ...x,
        onCancel: promise,
      }),
    };
  };
}
