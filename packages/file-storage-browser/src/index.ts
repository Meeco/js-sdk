import { EncryptionKey } from '@meeco/cryppo';
import * as Common from '@meeco/file-storage-common';
import { IFileStorageAuthConfiguration } from '@meeco/file-storage-common';
import { DirectAttachment, Thumbnail } from '@meeco/vault-api-sdk';
import { ThumbnailService } from './thumbnail-service';
import { AttachmentService } from './attachment-service';

/**
 * API v4.0.0
 * Deprecations will be removed in v.5.0.0 release
 */

export { ThumbnailType, ThumbnailTypes } from '@meeco/file-storage-common';
export * from './thumbnail-service';
export * from './attachment-service';

export const thumbSizeTypeToMimeExt: (
  sizeTypeString: Common.ThumbnailType | string
) => {
  mimeType: string;
  fileExtension: string;
} = Common.thumbSizeTypeToMimeExt;

/** @deprecated Use [[ThumbnailService.download]] */
export function downloadThumbnail({
  id,
  dataEncryptionKey,
  vaultUrl,
  authConfig,
}: {
  id: string;
  dataEncryptionKey: EncryptionKey;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
}): Promise<Uint8Array> {
  const service = new ThumbnailService(vaultUrl);
  return service.download({ id, key: dataEncryptionKey, authConfig });
}

/** @deprecated Use [[ThumbnailService.upload]] */
export function encryptAndUploadThumbnail({
  thumbnail,
  binaryId,
  attachmentDek,
  sizeType,
  authConfig,
  vaultUrl,
}: {
  thumbnail: Uint8Array;
  binaryId: string;
  attachmentDek: EncryptionKey;
  sizeType: Common.ThumbnailType;
  authConfig: IFileStorageAuthConfiguration;
  vaultUrl: string;
}): Promise<Thumbnail> {
  const service = new ThumbnailService(vaultUrl);
  return service.upload({
    thumbnail: { data: thumbnail, sizeType },
    attachmentId: binaryId,
    key: attachmentDek,
    authConfig,
  });
}

/** @deprecated Use [[AttachmentService.upload]] */
export function fileUploadBrowser({
  file,
  vaultUrl,
  authConfig,
  videoCodec,
  progressUpdateFunc,
  onCancel,
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
  const service = new AttachmentService(vaultUrl);
  return service.upload({ file, authConfig, videoCodec, progressUpdateFunc, cancel: onCancel });
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
export const fileUploadBrowserWithCancel: (_: {
  file: File;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  videoCodec?: string;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void)
    | null;
}) => {
  cancel: () => void;
  success: Promise<{ attachment: DirectAttachment; dek: EncryptionKey }>;
} = Common.withCancel(fileUploadBrowser);

/** @deprecated Use [[AttachmentService.download]] */
export function fileDownloadBrowser({
  attachmentId,
  dek,
  vaultUrl,
  authConfig,
  progressUpdateFunc,
  onCancel,
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
  const service = new AttachmentService(vaultUrl);
  return service.download({ attachmentId, dek, authConfig, progressUpdateFunc, cancel: onCancel });
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
export const fileDownloadBrowserWithCancel: (_: {
  attachmentId: string;
  dek: EncryptionKey;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number, videoCodec?: string) => void)
    | null;
  onCancel?: any;
}) => { cancel: () => void; success: Promise<File> } = Common.withCancel(fileDownloadBrowser);
