import { bytesBufferToBinaryString, EncryptionKey } from '@meeco/cryppo';
import {
  AzureBlockDownload,
  buildApiConfig,
  createAttachmentUploadUrl,
  directAttachmentAttach,
  directAttachmentUpload,
  downloadAttachment,
  downloadThumbnailCommon,
  encryptAndUploadThumbnailCommon,
  getDirectAttachmentInfo,
  IFileStorageAuthConfiguration,
} from '@meeco/file-storage-common';
import {
  AttachmentDirectDownloadUrl,
  DirectAttachment,
  DirectAttachmentsApi,
} from '@meeco/vault-api-sdk';
import * as FileUtils from './FileUtils.web';

export { ThumbnailType, ThumbnailTypes, thumbSizeTypeToMimeExt } from '@meeco/file-storage-common';
export { downloadThumbnailCommon as downloadThumbnail };
export { encryptAndUploadThumbnailCommon as encryptAndUploadThumbnail };

/**
 * Upload a new attachment. It is encrypted with a random DEK that is returned with the attachment
 * metadata.
 * @param {object} __namedParameters Options
 * @param file
 * @param vaultUrl Base URL of the Meeco Vault. Usually should be https://sandbox.meeco.me/vault.
 * @param authConfig Contains the DEK and the appropriate auth tokens.
 * @param videoCodec Optionally record the video codec in attachment metadata.
 * @param progressUpdateFunc reporter callback
 * @param onCancel Promise that, if resolved, cancels the upload.
 */
export async function fileUploadBrowser({
  file,
  vaultUrl,
  authConfig,
  videoCodec,
  progressUpdateFunc = null,
  onCancel = null,
}: {
  file: File;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  videoCodec?: string;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void)
    | null;
  onCancel?: any;
}): Promise<{ attachment: DirectAttachment; dek: EncryptionKey }> {
  if (progressUpdateFunc) {
    progressUpdateFunc(null, 0);
  }

  const dek = EncryptionKey.generateRandom();

  const uploadUrl = await createAttachmentUploadUrl(
    {
      fileSize: file.size,
      fileType: file.type,
      fileName: file.name,
    },
    authConfig,
    vaultUrl,
    undefined
  );

  const uploadResult = await directAttachmentUpload(
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

  const artifactsUploadUrl = await createAttachmentUploadUrl(
    {
      fileName: artifactsFileName,
      fileType: 'application/json',
      fileSize: artifactsFile.size,
    },
    authConfig,
    vaultUrl
  );
  await directAttachmentUpload(
    {
      directUploadUrl: artifactsUploadUrl.url,
      file: artifactsFile,
      encrypt: false,
    },
    FileUtils,
    null,
    onCancel
  );
  const attachedDoc = await directAttachmentAttach(
    {
      blobId: uploadUrl.blob_id,
      blobKey: uploadUrl.blob_key,
      artifactsBlobId: artifactsUploadUrl.blob_id,
      artifactsBlobKey: artifactsUploadUrl.blob_key,
    },
    authConfig,
    vaultUrl
  );
  return { attachment: attachedDoc.attachment, dek };
}

/**
 * @param {object} __namedParameters Options
 * @param dek TODO used for chunked upload but not for regular?
 * @param vaultUrl Base URL of the Meeco Vault. Usually should be https://sandbox.meeco.me/vault.
 * @param authConfig Contains the DEK and the appropriate auth tokens.
 * @param progressUpdateFunc TODO not used in regular case!
 * @param onCancel Promise that, if resolved, cancels the download.
 */
export async function fileDownloadBrowser({
  attachmentId,
  dek,
  vaultUrl,
  authConfig,
  progressUpdateFunc = null,
  onCancel = null,
}: {
  attachmentId: string;
  dek: EncryptionKey;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number, videoCodec?: string) => void)
    | null;
  onCancel?: any;
}): Promise<File> {
  if (progressUpdateFunc) {
    progressUpdateFunc(null, 0);
  }

  const attachmentInfo = await getDirectAttachmentInfo({ attachmentId }, authConfig, vaultUrl);

  let buffer: Uint8Array;
  const fileName: string = attachmentInfo.attachment.filename;
  if (attachmentInfo.attachment.is_direct_upload) {
    // was uploaded in chunks
    const downloaded = await largeFileDownloadBrowser(
      attachmentId,
      dek,
      authConfig,
      vaultUrl,
      progressUpdateFunc,
      onCancel
    );
    buffer = downloaded.byteArray;
  } else {
    // was not uploaded in chunks
    const downloaded = await downloadAttachment(attachmentId, dek, authConfig, vaultUrl);
    buffer = downloaded || new Uint8Array();
  }

  return new File([buffer], fileName, {
    type: attachmentInfo.attachment.content_type,
  });
}

/**
 * Download a file in chunks from Azure block storage. See [[AzureBlockDownload]]
 * @param dek A separate DEK from the `authConfig` one for some reason
 */
async function largeFileDownloadBrowser(
  attachmentID: string,
  dek: EncryptionKey | null,
  authConfig: IFileStorageAuthConfiguration,
  vaultUrl: string,
  progressUpdateFunc:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number, videoCodec?: string) => void)
    | null,
  onCancel?: any
) {
  const encryptionArtifactInfo = await getDirectDownloadInfo(
    attachmentID,
    'encryption_artifact_file',
    authConfig,
    vaultUrl
  );
  const attachmentInfo = await getDirectDownloadInfo(
    attachmentID,
    'binary_file',
    authConfig,
    vaultUrl
  );

  // download encryption artifacts
  let client = new AzureBlockDownload(encryptionArtifactInfo.url);
  const encryptionArtifacts = await client
    .start(null, null, null, null, onCancel)
    .then((resultBuffer: any) => JSON.parse(bytesBufferToBinaryString(resultBuffer)));
  const videoCodec = encryptionArtifacts.videoCodec;

  if (progressUpdateFunc && videoCodec) {
    progressUpdateFunc(null, 0, videoCodec);
  }

  // use encryption artifacts to initiate file download
  client = new AzureBlockDownload(attachmentInfo.url);
  let blocks = new Uint8Array();
  for (let index = 0; index < encryptionArtifacts.range.length; index++) {
    const block: any = await client.start(
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

async function getDirectDownloadInfo(
  id: string,
  type: 'binary_file' | 'encryption_artifact_file',
  authConfig: IFileStorageAuthConfiguration,
  vaultUrl: string
): Promise<AttachmentDirectDownloadUrl> {
  const api = new DirectAttachmentsApi(buildApiConfig(authConfig, vaultUrl));
  const result = await api.directAttachmentsIdDownloadUrlGet(id, type);
  return result.attachment_direct_download_url;
}

/**
 * Injects a function that can be used to cancel a long running download/upload.
 * Argument function "f" must have named param "onCancel".
 */
function withCancel<S, T>(
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
export const fileDownloadBrowserWithCancel = withCancel<
  {
    attachmentId: string;
    dek: EncryptionKey;
    vaultUrl: string;
    authConfig: IFileStorageAuthConfiguration;
    progressUpdateFunc?:
      | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number, videoCodec?: string) => void)
      | null;
  },
  Promise<File>
>(fileDownloadBrowser);

/**
 * Wraps [[fileUploadBrowser]] injecting a callable function that will cancel the action.
 * @returns An object with attributes `cancel`: the function to cancel the upload, `success` contains
 * the original result promise.
 */
export const fileUploadBrowserWithCancel = withCancel<
  {
    file: File;
    vaultUrl: string;
    authConfig: IFileStorageAuthConfiguration;
    videoCodec?: string;
    progressUpdateFunc?:
      | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void)
      | null;
  },
  Promise<{ attachment: any; dek: EncryptionKey }>
>(fileUploadBrowser);
